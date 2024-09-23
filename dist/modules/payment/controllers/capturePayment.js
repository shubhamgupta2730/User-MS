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
const mongoose_1 = __importDefault(require("mongoose"));
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
});
const createPaymentIntent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId, currency, paymentMethodId } = req.body;
        // Validate input
        if (!orderId || !mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid orderId format' });
        }
        if (!currency) {
            return res.status(400).json({ message: 'Currency is required' });
        }
        if (!paymentMethodId) {
            return res.status(400).json({ message: 'Payment method ID is required' });
        }
        // Retrieve the order
        const order = (yield orderModel_1.default.findById(orderId));
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.paymentStatus === 'paid') {
            return res
                .status(400)
                .json({ message: 'Payment has already been completed for this order' });
        }
        const amount = order.totalAmount * 100;
        // Create and confirm a PaymentIntent with automatic payment methods
        const paymentIntent = yield stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            payment_method: paymentMethodId,
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
            metadata: { orderId: order._id.toString() },
        });
        // Save the PaymentIntent ID to the order
        order.stripePaymentIntentId = paymentIntent.id;
        yield order.save();
        res.status(200).json({
            message: 'payment initiated to payment gateway',
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = createPaymentIntent;
