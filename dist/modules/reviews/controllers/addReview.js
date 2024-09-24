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
const cloudinary_1 = require("cloudinary");
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});
// Set up multer for file uploads
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // Use memory storage for uploading directly to Cloudinary
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).array('images', 5); // Limit to 5 images
const addReview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    upload(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            if (err) {
                return res.status(400).json({ message: 'Image upload failed', error: err.message });
            }
            const { orderId, productId, bundleId, rating, reviewText } = req.body;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            // Validate inputs
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (!orderId) {
                return res.status(400).json({ message: 'Order ID is required' });
            }
            if ((!productId && !bundleId) || (productId && bundleId)) {
                return res.status(400).json({
                    message: 'Provide either productId or bundleId, but not both.',
                });
            }
            if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
                return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
            }
            // Find the order and validate user ownership
            const order = yield orderModel_1.default.findById(orderId);
            if (!order || order.userId.toString() !== userId) {
                return res.status(404).json({ message: 'Order not found or unauthorized' });
            }
            // Check if the order status is 'delivered'
            if (order.status !== 'delivered') {
                return res.status(400).json({ message: 'Review can only be added for delivered orders' });
            }
            // Validate the productId or bundleId against the items in the order
            let isValidItem = false;
            if (productId) {
                isValidItem = order.items.some((item) => { var _a; return ((_a = item.productId) === null || _a === void 0 ? void 0 : _a.toString()) === productId; });
                if (!isValidItem) {
                    return res.status(400).json({ message: 'Product not found in order items' });
                }
            }
            if (bundleId) {
                isValidItem = order.items.some((item) => { var _a; return ((_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.toString()) === bundleId; });
                if (!isValidItem) {
                    return res.status(400).json({ message: 'Bundle not found in order items' });
                }
            }
            // Upload images to Cloudinary and get their URLs
            const uploadPromises = req.files.map((file) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary_1.v2.uploader.upload_stream({ folder: 'reviews' }, (error, result) => {
                        if (error) {
                            return reject(new Error('Image upload failed: ' + error.message));
                        }
                        if (result === null || result === void 0 ? void 0 : result.secure_url) {
                            return resolve(result.secure_url); // Return the image URL
                        }
                        return reject(new Error('Image upload failed: result is undefined'));
                    });
                    stream.end(file.buffer); // Pipe the file buffer to Cloudinary
                });
            });
            // Resolve all image upload promises
            const imageUrls = yield Promise.all(uploadPromises);
            // Create a new review
            const review = new reviewModel_1.default({
                userId,
                orderId,
                productId: productId || undefined,
                bundleId: bundleId || undefined,
                rating,
                reviewText: reviewText || '',
                images: imageUrls, // Use Cloudinary image URLs
            });
            // Save the review to the database
            yield review.save();
            res.status(201).json({ message: 'Review added successfully', review });
        }
        catch (error) {
            const err = error;
            res.status(500).json({ message: 'Internal Server Error', error: err.message });
        }
    }));
});
exports.default = addReview;
