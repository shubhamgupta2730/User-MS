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
const nodemailer_1 = __importDefault(require("nodemailer"));
const axios_1 = __importDefault(require("axios"));
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const userModel_1 = __importDefault(require("../../../models/userModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const couponModel_1 = __importDefault(require("../../../models/couponModel"));
const couponUsage_1 = __importDefault(require("../../../models/couponUsage"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
});
// Email setup
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
// Address validation helper function
const validateAddress = (address) => {
    const { addressLine1, street, city, state, postalCode, country } = address;
    if (!addressLine1 ||
        typeof addressLine1 !== 'string' ||
        addressLine1.trim() === '') {
        return 'Address Line 1 is required and should be a non-empty string';
    }
    if (street && typeof street !== 'string') {
        return 'Street should be a string';
    }
    if (city && typeof city !== 'string') {
        return 'City should be a string';
    }
    if (state && typeof state !== 'string') {
        return 'State should be a string';
    }
    if (postalCode && typeof postalCode !== 'string') {
        return 'Postal Code should be a string';
    }
    if (country && typeof country !== 'string') {
        return 'Country should be a string';
    }
    return null;
};
const placeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { shippingAddress, paymentMethod, paymentMethodToken, couponCode } = req.body;
        // Validate payment method
        if (!['Card', 'COD'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }
        // Validate shipping address
        if (shippingAddress) {
            const validationError = validateAddress(shippingAddress);
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }
        }
        // Retrieve the most recent pending order
        const order = yield orderModel_1.default.findOne({ userId, status: 'pending' }).sort({
            createdAt: -1,
        });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Coupon application logic
        let discountAmount = 0;
        if (couponCode) {
            const coupon = yield couponModel_1.default.findOne({
                code: couponCode,
                isDeleted: false,
            });
            if (!coupon) {
                return res.status(400).json({ message: 'Invalid or expired coupon' });
            }
            // Check coupon validity (validFrom, validUntil)
            const currentDate = new Date();
            if (coupon.validFrom && coupon.validFrom > currentDate) {
                return res.status(400).json({ message: 'Coupon not yet valid' });
            }
            if (coupon.validUntil && coupon.validUntil < currentDate) {
                return res.status(400).json({ message: 'Coupon has expired' });
            }
            // Check if the order total meets the minimum order value
            if (coupon.minOrderValue && order.totalAmount < coupon.minOrderValue) {
                return res.status(400).json({
                    message: `Minimum order value to use this coupon is ${coupon.minOrderValue}`,
                });
            }
            // Check the global usage limit of the coupon
            if (coupon.usageCount >= coupon.usageLimit) {
                return res.status(400).json({
                    message: 'This coupon has reached its usage limit.',
                });
            }
            // Check the user's coupon usage count
            const couponUsage = yield couponUsage_1.default.findOne({ userId, couponCode });
            const userUsageCount = couponUsage ? couponUsage.usageCount : 0;
            // Enforce the per-user usage limit
            if (couponUsage && userUsageCount >= coupon.usageLimit) {
                return res.status(400).json({
                    message: `You have reached the usage limit for this coupon.`,
                });
            }
            // Apply the coupon based on discount type
            if (coupon.discountType === 'percentage') {
                discountAmount = (order.totalAmount * coupon.discountValue) / 100;
            }
            else if (coupon.discountType === 'flat') {
                discountAmount = coupon.discountValue;
            }
            // Ensure the discount doesn't exceed the total amount
            discountAmount = Math.min(discountAmount, order.totalAmount);
            // Update order total amount after discount
            order.totalAmount -= discountAmount;
            // Increment coupon usage count (global usage)
            coupon.usageCount += 1;
            yield coupon.save();
            // Update coupon usage count for the user
            if (couponUsage) {
                couponUsage.usageCount += 1;
                yield couponUsage.save();
            }
            else {
                // Create a new CouponUsage record for the user
                yield couponUsage_1.default.create({ userId, couponCode, usageCount: 1 });
            }
        }
        let paymentMethodId;
        // If the payment method is card, create a PaymentMethod using the token
        if (paymentMethod === 'Card') {
            if (!paymentMethodToken) {
                return res.status(400).json({
                    message: 'Payment method token is required for card payments',
                });
            }
            const paymentMethodResponse = yield stripe.paymentMethods.create({
                type: 'card',
                card: { token: paymentMethodToken },
                billing_details: {
                    name: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userId,
                },
            });
            paymentMethodId = paymentMethodResponse.id;
        }
        // Handle shipping address
        let addressToUse;
        if (shippingAddress) {
            const user = yield userModel_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const addressExists = user.address.some((addr) => addr.addressLine1 === shippingAddress.addressLine1 &&
                addr.street === shippingAddress.street &&
                addr.city === shippingAddress.city &&
                addr.state === shippingAddress.state &&
                addr.postalCode === shippingAddress.postalCode &&
                addr.country === shippingAddress.country);
            if (!addressExists) {
                yield userModel_1.default.updateOne({ _id: userId }, { $push: { address: shippingAddress } });
            }
            addressToUse = shippingAddress;
        }
        else {
            const user = yield userModel_1.default.findById(userId);
            if (!user || user.address.length === 0) {
                return res.status(400).json({ message: 'No address available' });
            }
            addressToUse = user.address[user.address.length - 1];
        }
        order.shippingAddress = addressToUse;
        order.paymentMethod = paymentMethod;
        if (paymentMethodId) {
            order.stripePaymentMethodId = paymentMethodId;
        }
        // Set order and delivery dates
        order.orderDate = new Date();
        if (paymentMethod === 'COD') {
            order.deliveryDate = new Date(); // Set delivery date as today for COD
            order.status = 'processing';
            // Deduct product quantity
            for (const item of order.items) {
                if (item.productId) {
                    const product = yield productModel_1.default.findById(item.productId);
                    if (product) {
                        if (product.quantity < item.quantity) {
                            return res.status(400).json({
                                message: `Not enough quantity available for ${product.name}`,
                            });
                        }
                        product.quantity -= item.quantity;
                        yield product.save();
                    }
                    else {
                        return res.status(404).json({ message: 'Product not found' });
                    }
                }
            }
            // Send confirmation email for COD orders
            const user = yield userModel_1.default.findById(userId);
            if (user && user.email) {
                const itemsList = order.items
                    .map((item) => `Product: ${item.name}\nQuantity: ${item.quantity}\nPrice: Rs ${item.price}\n`)
                    .join('\n');
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Order Confirmation',
                    text: `Dear ${user.firstName},\n\nYour order has been placed successfully. Here are the details:\n\nOrder ID: ${order._id}\nTotal Amount: Rs ${order.totalAmount}\nDiscount: Rs ${discountAmount}\nShipping Address: ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}\n\nItems Purchased:\n\n${itemsList}\nYour order will be delivered today.\n\nThank you for shopping with us!\n\nBest regards,\nE-Commerce Platform`,
                };
                yield transporter.sendMail(mailOptions);
            }
            // Schedule status update to "delivered" after 5 minutes
            yield axios_1.default.post(`http://localhost:3005/schedule-delivery`, {
                orderId: order._id,
            });
        }
        yield order.save();
        res.status(200).json({
            message: 'Order placed successfully',
            order: {
                _id: order._id,
                userId: order.userId,
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                totalAmount: order.totalAmount,
                discountAmount,
                status: order.status,
                stripePaymentMethodId: paymentMethodId,
                orderDate: order.orderDate,
                deliveryDate: order.deliveryDate,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = placeOrder;
