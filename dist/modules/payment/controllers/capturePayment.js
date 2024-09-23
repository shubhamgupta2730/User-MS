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
const razorpay_1 = __importDefault(require("razorpay"));
const mongoose_1 = __importDefault(require("mongoose"));
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const razorpay = new razorpay_1.default({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});
const validCurrencies = ['INR', 'USD', 'EUR']; // Example of valid currencies, adjust as needed
const capturePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, currency } = req.body;
        // Validate input
        if (!orderId || !mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid orderId format' });
        }
        if (!currency || typeof currency !== 'string' || !validCurrencies.includes(currency)) {
            return res.status(400).json({ message: 'Invalid or unsupported currency' });
        }
        // Retrieve the order to get the totalAmount and check payment status
        const order = yield orderModel_1.default.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Payment has already been completed for this order' });
        }
        if (order.razorpayOrderId) {
            return res.status(400).json({ message: 'Payment initiation has already been done for this order' });
        }
        const amount = order.totalAmount * 100; // Razorpay expects the amount in paise (smallest currency unit)
        // Create Razorpay order
        const razorpayOrder = yield razorpay.orders.create({
            amount: amount,
            currency: currency,
            receipt: orderId,
            payment_capture: true, // Razorpay expects a boolean for payment_capture
        });
        if (!razorpayOrder) {
            return res.status(500).json({ message: 'Failed to create Razorpay order' });
        }
        // Save Razorpay order ID to the database to prevent duplicate payment attempts
        order.razorpayOrderId = razorpayOrder.id;
        yield order.save();
        res.status(200).json({
            orderId: orderId,
            razorpayOrderId: razorpayOrder.id,
            amount: amount / 100, // Convert back to main currency unit
            currency: currency,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = capturePayment;
