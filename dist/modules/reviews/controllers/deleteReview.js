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
const reviewModel_1 = __importDefault(require("../../../models/reviewModel"));
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const deleteReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.query;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // Validate input
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!reviewId) {
            return res.status(400).json({ message: 'Review ID is required' });
        }
        // Find the review
        const review = yield reviewModel_1.default.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        // Check if the review belongs to the logged-in user
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Forbidden: Not your review' });
        }
        // Find the associated order
        const order = yield orderModel_1.default.findById(review.orderId);
        if (!order || order.userId.toString() !== userId) {
            return res.status(404).json({
                message: 'Order not found or unauthorized access to review',
            });
        }
        // Soft delete the review by setting isDeleted to true
        review.isDeleted = true;
        yield review.save();
        res
            .status(200)
            .json({ message: 'Review deleted successfully (soft delete)' });
    }
    catch (error) {
        const err = error;
        res
            .status(500)
            .json({ message: 'Internal Server Error', error: err.message });
    }
});
exports.default = deleteReview;
