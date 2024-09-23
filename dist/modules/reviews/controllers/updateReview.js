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
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Set up Multer for local image storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../../uploads/reviewImages');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage }).array('images', 5);
const updateReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            if (err) {
                return res
                    .status(500)
                    .json({ message: 'Image upload failed', error: err.message });
            }
            const { reviewId } = req.query;
            const { rating, reviewText, productId, bundleId, images } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            // Validate input data
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (!reviewId) {
                return res.status(400).json({ message: 'Review ID is required' });
            }
            // Find the review
            const review = yield reviewModel_1.default.findById(reviewId);
            if (!review || review.isDeleted) {
                return res
                    .status(404)
                    .json({ message: 'Review not found or already deleted' });
            }
            // Validate that the user owns the review
            if (review.userId.toString() !== userId) {
                return res.status(403).json({ message: 'Forbidden: Not your review' });
            }
            // Validate that the associated order is delivered
            const order = yield orderModel_1.default.findById(review.orderId);
            if (!order || order.status !== 'delivered') {
                return res
                    .status(400)
                    .json({ message: 'Review can only be updated for delivered orders' });
            }
            // Validate that only one of productId or bundleId is provided
            if ((!productId && !bundleId) || (productId && bundleId)) {
                return res.status(400).json({
                    message: 'Provide either productId or bundleId, but not both.',
                });
            }
            // Validate the rating
            if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
                return res
                    .status(400)
                    .json({ message: 'Rating must be a number between 1 and 5' });
            }
            // Validate the productId or bundleId against the items in the order
            let isValidItem = false;
            if (productId) {
                isValidItem = order.items.some((item) => { var _a; return ((_a = item.productId) === null || _a === void 0 ? void 0 : _a.toString()) === productId; });
                if (!isValidItem) {
                    return res
                        .status(400)
                        .json({ message: 'Product not found in order items' });
                }
            }
            if (bundleId) {
                isValidItem = order.items.some((item) => { var _a; return ((_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.toString()) === bundleId; });
                if (!isValidItem) {
                    return res
                        .status(400)
                        .json({ message: 'Bundle not found in order items' });
                }
            }
            // Update images if new ones are provided
            let updatedImages = review.images; // Keep existing images
            if (Array.isArray(images) && images.length > 0) {
                // If images are provided in req.body, use them
                updatedImages = images;
            }
            else if (Array.isArray(req.files) && req.files.length > 0) {
                // Delete old images from the file system
                if (updatedImages && updatedImages.length > 0) {
                    updatedImages.forEach((imagePath) => {
                        const fullPath = path_1.default.join(__dirname, '../../../', imagePath);
                        if (fs_1.default.existsSync(fullPath)) {
                            fs_1.default.unlinkSync(fullPath);
                        }
                    });
                }
                // Save new image paths
                updatedImages = req.files.map((file) => file.path);
            }
            // Update the review fields
            review.rating = rating;
            review.reviewText = reviewText || review.reviewText;
            review.images = updatedImages;
            review.productId = productId || review.productId;
            review.bundleId = bundleId || review.bundleId;
            // Save the updated review
            yield review.save();
            res.status(200).json({ message: 'Review updated successfully', review });
        }
        catch (error) {
            const err = error;
            res
                .status(500)
                .json({ message: 'Internal Server Error', error: err.message });
        }
    }));
});
exports.default = updateReview;
