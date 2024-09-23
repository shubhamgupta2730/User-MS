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
exports.addToWishlist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const wishlistModel_1 = __importDefault(require("../../../models/wishlistModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const addToWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const { productId, bundleId } = req.body;
    if (!productId && !bundleId) {
        return res.status(400).json({
            message: 'Either productId or bundleId must be provided.',
        });
    }
    if (productId && bundleId) {
        return res.status(400).json({
            message: 'Provide only one of productId or bundleId, not both.',
        });
    }
    try {
        let wishlist = yield wishlistModel_1.default.findOne({ userId });
        if (!wishlist) {
            wishlist = new wishlistModel_1.default({ userId, items: [] });
        }
        if (productId) {
            if (!mongoose_1.default.isValidObjectId(productId)) {
                return res.status(400).json({ message: 'Invalid product ID.' });
            }
            const product = yield productModel_1.default.findOne({
                _id: productId,
                isActive: true,
                isDeleted: false,
                isBlocked: false,
            }).select('name description');
            if (!product) {
                return res
                    .status(404)
                    .json({ message: 'Product not found or inactive.' });
            }
            const existingProduct = wishlist.items.find((item) => { var _a; return (_a = item.productId) === null || _a === void 0 ? void 0 : _a.equals(productId); });
            if (existingProduct) {
                return res
                    .status(400)
                    .json({ message: 'Product already in wishlist.' });
            }
            else {
                wishlist.items.push({ productId });
            }
            res.status(200).json({
                message: 'Product added to wishlist successfully.',
                item: {
                    productId: product._id,
                    name: product.name,
                    description: product.description,
                },
            });
        }
        if (bundleId) {
            if (!mongoose_1.default.isValidObjectId(bundleId)) {
                return res.status(400).json({ message: 'Invalid bundle ID.' });
            }
            const bundle = yield bundleProductModel_1.default.findOne({
                _id: bundleId,
                isActive: true,
                isDeleted: false,
                isBlocked: false,
            }).select('name description');
            if (!bundle) {
                return res
                    .status(404)
                    .json({ message: 'Bundle not found or inactive.' });
            }
            const existingBundle = wishlist.items.find((item) => { var _a; return (_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.equals(bundleId); });
            if (existingBundle) {
                return res.status(400).json({ message: 'Bundle already in wishlist.' });
            }
            else {
                wishlist.items.push({ bundleId });
            }
            res.status(200).json({
                message: 'Bundle added to wishlist successfully.',
                item: {
                    bundleId: bundle._id,
                    name: bundle.name,
                    description: bundle.description,
                },
            });
        }
        wishlist.updatedAt = new Date();
        yield wishlist.save();
    }
    catch (error) {
        console.error('Failed to add item to wishlist:', error);
        res.status(500).json({ message: 'Failed to add item to wishlist.', error });
    }
});
exports.addToWishlist = addToWishlist;
