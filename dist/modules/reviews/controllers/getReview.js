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
const getReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Find the review and ensure it belongs to the user and is not soft-deleted
        const review = yield reviewModel_1.default.findOne({
            _id: reviewId,
            userId: userId,
            isDeleted: false,
        });
        if (!review) {
            return res.status(404).json({
                message: 'Review not found or has been deleted',
            });
        }
        // Return the review details
        res.status(200).json({ review });
    }
    catch (error) {
        const err = error;
        res
            .status(500)
            .json({ message: 'Internal Server Error', error: err.message });
    }
});
exports.default = getReview;
