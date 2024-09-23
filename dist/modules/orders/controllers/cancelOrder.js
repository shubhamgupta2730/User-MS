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
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const sendMail_1 = require("../../../utils/sendMail");
const stripe_1 = __importDefault(require("stripe"));
const userModel_1 = __importDefault(require("../../../models/userModel"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
});
const cancelOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { orderId } = req.query;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const { refundReason } = req.body;
        // Validate inputs
        if (!orderId || typeof orderId !== 'string') {
            return res.status(400).json({ message: 'Invalid order ID' });
        }
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!refundReason ||
            typeof refundReason !== 'string' ||
            refundReason.trim().length === 0) {
            return res.status(400).json({ message: 'Refund reason is required' });
        }
        // Retrieve the order
        const order = yield orderModel_1.default.findById(orderId)
            .populate('items.productId')
            .populate('items.bundleId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const user = yield userModel_1.default.findById(userId);
        const userMail = user === null || user === void 0 ? void 0 : user.email;
        // Check if the order belongs to the current user
        if (order.userId.toString() !== userId) {
            return res
                .status(403)
                .json({ message: 'You are not authorized to cancel this order' });
        }
        // Check if the order can be canceled
        if (order.status !== 'pending' && order.status !== 'processing') {
            return res.status(400).json({ message: 'Order cannot be canceled' });
        }
        // Update order status and refund reason
        order.status = 'cancelled';
        order.refundStatus = 'requested';
        order.refundReason = refundReason; // Store the refund reason
        // Process refund if applicable
        if (order.paymentStatus === 'paid' && order.paymentMethod === 'Card') {
            try {
                const refund = yield stripe.refunds.create({
                    payment_intent: order.stripePaymentIntentId,
                    amount: Math.round(order.totalAmount * 100), // amount in cents
                });
                if (refund.status !== 'succeeded') {
                    return res.status(500).json({ message: 'Refund failed' });
                }
                order.refundStatus = 'completed';
                order.refundAmount = order.totalAmount;
                order.refundDate = new Date();
            }
            catch (error) {
                order.refundStatus = 'failed';
                return res
                    .status(500)
                    .json({ message: 'Refund process failed', error });
            }
        }
        // Restore product quantities
        for (const item of order.items) {
            if (item.productId) {
                const product = yield productModel_1.default.findById(item.productId);
                if (product) {
                    product.quantity += item.quantity;
                    yield product.save();
                }
            }
        }
        // Send cancellation email to the user
        const emailSubject = 'Order Cancellation';
        const emailHtml = `
      <p>Dear ${order.userId.firstName},</p>
      <p>Your order <strong>#${order._id}</strong> has been successfully canceled.</p>
      <p>Order Details:</p>
      <ul>
        ${order.items
            .map((item) => `
              <li>${item.productId ? item.productId.name : 'Bundle'} - 
              Quantity: ${item.quantity}, 
              Price: Rs ${item.price}</li>`)
            .join('')}
      </ul>
      <p>Total Amount: Rs ${order.totalAmount}</p>
      <p>Refund Status: ${order.refundStatus}</p>
      <p>Refund Reason: ${order.refundReason}</p>
      <p>Thank you for shopping with us!</p>
      <p>Best regards,<br>E-Commerce Platform</p>
    `;
        yield (0, sendMail_1.sendEmail)(userMail, emailSubject, emailHtml);
        // Save the updated order
        yield order.save();
        res.status(200).json({ message: 'Order canceled successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = cancelOrder;
