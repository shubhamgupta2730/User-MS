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
const mongoose_1 = __importDefault(require("mongoose"));
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;
        // Validate input
        if (!razorpayOrderId || typeof razorpayOrderId !== 'string') {
            return res.status(400).json({ message: 'Invalid razorpayOrderId' });
        }
        if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string') {
            return res.status(400).json({ message: 'Invalid razorpayPaymentId' });
        }
        if (!razorpaySignature || typeof razorpaySignature !== 'string') {
            return res.status(400).json({ message: 'Invalid razorpaySignature' });
        }
        if (!orderId || !mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid orderId format' });
        }
        // Generate the signature to verify payment
        const generatedSignature = crypto_1.default.createHmac('sha256', process.env.KEY_SECRET)
            .update(razorpayOrderId + '|' + razorpayPaymentId)
            .digest('hex');
        // Verify the signature
        if (generatedSignature !== razorpaySignature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }
        // Find the order by ID
        const order = yield orderModel_1.default.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Check if the order has already been paid
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Order already paid' });
        }
        // Update the order's payment status to 'paid' and order status to 'processing'
        order.paymentStatus = 'paid';
        order.status = 'processing';
        yield order.save();
        res.status(200).json({
            message: 'Payment verified successfully',
            orderId: order._id,
            paymentStatus: order.paymentStatus,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = verifyPayment;
