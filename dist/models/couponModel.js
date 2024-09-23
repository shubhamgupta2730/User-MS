"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const couponSchema = new mongoose_1.Schema({
    code: { type: String, unique: true, required: true },
    discountType: { type: String, enum: ['percentage', 'flat'], required: true },
    discountValue: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 1 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    usageCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
});
const Coupon = (0, mongoose_1.model)('Coupon', couponSchema);
exports.default = Coupon;
