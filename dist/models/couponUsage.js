"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CouponUsageSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    couponCode: { type: String, required: true },
    usageCount: { type: Number, default: 0 },
});
exports.default = mongoose_1.default.model('CouponUsage', CouponUsageSchema);
