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
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
});
const refundWebhookHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
    if (event.type === 'refund.created' || event.type === 'refund.updated') {
        const refund = event.data.object;
        const orderId = (_a = refund.metadata) === null || _a === void 0 ? void 0 : _a.orderId;
        // Fetch the order from the database
        const order = yield orderModel_1.default.findById(orderId);
        if (order) {
            // Update the order based on the refund event
            if (event.type === 'refund.created') {
                order.refundStatus = 'requested';
                order.refundAmount = (refund.amount / 100);
                order.refundDate = new Date(refund.created * 1000);
                // Optionally store refund reason if available
                if (refund.reason) {
                    order.refundReason = refund.reason;
                }
            }
            else if (event.type === 'refund.updated') {
                if (refund.status === 'succeeded') {
                    order.refundStatus = 'completed';
                }
                else if (refund.status === 'failed') {
                    order.refundStatus = 'failed';
                }
                // Update refund amount and date if needed
                if (order.refundStatus !== 'failed') {
                    order.refundAmount = (refund.amount / 100);
                    order.refundDate = new Date(refund.created * 1000);
                }
            }
            yield order.save();
        }
    }
    res.json({ received: true });
});
exports.default = refundWebhookHandler;
