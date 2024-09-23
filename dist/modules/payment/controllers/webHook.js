"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const sendMail_1 = require("../../../utils/sendMail");
const axios_1 = __importDefault(require("axios")); // Import axios
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
});
const webhookHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
    catch (err) {
        const error = err;
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    const order = yield orderModel_1.default.findById(orderId)
        .populate('userId', 'email firstName')
        .populate('items.productId', 'name quantity')
        .populate('items.bundleId', 'name quantity');
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    switch (event.type) {
        case 'payment_intent.succeeded':
            order.paymentStatus = 'paid';
            order.status = 'processing';
            // Update the quantity of each product
            for (const item of order.items) {
                if (item.productId) {
                    const product = yield productModel_1.default.findById(item.productId);
                    if (!product) {
                        console.error(`Product with ID ${item.productId} not found.`);
                        continue;
                    }
                    if (product.quantity < item.quantity) {
                        console.error(`Insufficient quantity for product ${product.name}.`);
                        // You might want to handle this case (e.g., rollback, notify admin)
                        continue;
                    }
                    product.quantity -= item.quantity; // Deduct the quantity
                    yield product.save();
                }
            }
            // Construct the items list for the email
            const itemsList = order.items
                .map((item) => { var _a; return `Product: ${item.productId ? item.productId.name : (_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.name}\nQuantity: ${item.quantity}\nPrice: Rs ${item.price}\n`; })
                .join('\n');
            // Prepare the email content
            const emailSubject = 'Order Confirmation';
            const emailHtml = `
      <p>Dear ${order.userId.firstName},</p>
      <p>Your order has been placed successfully. Here are the details:</p>
      <p><strong>Order ID:</strong> ${order._id}<br>
      <strong>Total Amount:</strong> Rs ${order.totalAmount}<br>
      <strong>Shipping Address:</strong> ${(_a = order.shippingAddress) === null || _a === void 0 ? void 0 : _a.addressLine1}, ${(_b = order.shippingAddress) === null || _b === void 0 ? void 0 : _b.city}, ${(_c = order.shippingAddress) === null || _c === void 0 ? void 0 : _c.state}, ${(_d = order.shippingAddress) === null || _d === void 0 ? void 0 : _d.postalCode}, ${(_e = order.shippingAddress) === null || _e === void 0 ? void 0 : _e.country}</p>
      <p><strong>Items Purchased:</strong></p>
      <ul>
        ${order.items
                .map((item) => {
                var _a;
                return `
              <li>${item.productId ? item.productId.name : (_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.name} - 
              Quantity: ${item.quantity}, 
              Price: Rs ${item.price}</li>`;
            })
                .join('')}
      </ul>
      <p>Your order will be delivered by <strong>${(_f = order.deliveryDate) === null || _f === void 0 ? void 0 : _f.toDateString()}</strong>.</p>
      <p>Thank you for shopping with us!</p>
      <p>Best regards,<br>E-Commerce Platform</p>
    `;
            // Send the confirmation email to the user
            yield (0, sendMail_1.sendEmail)(order.userId.email, emailSubject, emailHtml);
            // Call the scheduler microservice to update the order status to delivered after 5 minutes
            try {
                // Schedule status update to "delivered" after 5 minutes
                yield axios_1.default.post(`http://localhost:3005/schedule-delivery`, {
                    orderId: orderId,
                });
                console.log(`Scheduler service notified for Order ID: ${order._id}`);
            }
            catch (error) {
                console.error(`Failed to notify scheduler service for Order ID: ${order._id}`, error);
            }
            break;
        case 'payment_intent.payment_failed':
            order.paymentStatus = 'failed';
            order.status = 'failed';
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    yield order.save();
    res.json({ received: true });
});
exports.default = webhookHandler;
