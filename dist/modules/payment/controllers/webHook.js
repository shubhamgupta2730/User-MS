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
const crypto_1 = __importDefault(require("crypto"));
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const webhookHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const secret = process.env.KEY_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        const payload = JSON.stringify(req.body);
        console.log('Request Headers:', req.headers);
        // Verify the signature
        const generatedSignature = crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        if (generatedSignature !== signature) {
            console.log('Received Signature:', signature);
            console.log('Generated Signature:', generatedSignature);
            return res.status(400).json({ message: 'Invalid signature' });
        }
        console.log('Received Signature:', signature);
        console.log('Generated Signature:', generatedSignature);
        console.log('Payload:', payload);
        // Handle different event types
        const event = req.body.event;
        const data = req.body.payload.payment.entity;
        if (event === 'payment.captured') {
            const { order_id, id: payment_id } = data;
            // Find the order by Razorpay order ID
            const order = yield orderModel_1.default.findOne({ razorpayOrderId: order_id });
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            // Update the order's payment status to 'paid' if it's not already
            if (order.paymentStatus !== 'paid') {
                order.paymentStatus = 'paid';
                order.status = 'processing'; // or any other status you'd like to set
                yield order.save();
            }
            return res
                .status(200)
                .json({ message: 'Payment status updated successfully' });
        }
        // Add handling for other events if needed
        res.status(200).json({ message: 'Event received' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = webhookHandler;
