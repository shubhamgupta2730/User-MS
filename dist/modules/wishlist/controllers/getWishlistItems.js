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
exports.getWishlistItems = void 0;
const wishlistModel_1 = __importDefault(require("../../../models/wishlistModel"));
const getWishlistItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    try {
        // Find the wishlist for the user
        const wishlist = yield wishlistModel_1.default.findOne({ userId })
            .populate({
            path: 'items.productId',
            select: 'name description MRP sellingPrice discount adminDiscount categoryId',
        })
            .populate({
            path: 'items.bundleId',
            select: 'name description MRP sellingPrice discount adminDiscount products',
            populate: {
                path: 'products.productId',
                select: 'name',
            },
        });
        if (!wishlist || wishlist.items.length === 0) {
            return res
                .status(404)
                .json({ message: 'No items found in the wishlist.' });
        }
        // Transforming the response to include necessary product and bundle details
        const wishlistItems = wishlist.items.map((item) => {
            if (item.productId) {
                const product = item.productId;
                return {
                    type: 'product',
                    productId: product._id,
                    name: product.name,
                    description: product.description,
                    MRP: product.MRP,
                    sellingPrice: product.sellingPrice,
                    discount: product.discount,
                    adminDiscount: product.adminDiscount,
                    categoryId: product.categoryId,
                };
            }
            else if (item.bundleId) {
                const bundle = item.bundleId;
                return {
                    type: 'bundle',
                    bundleId: bundle._id,
                    name: bundle.name,
                    description: bundle.description,
                    MRP: bundle.MRP,
                    sellingPrice: bundle.sellingPrice,
                    discount: bundle.discount,
                    adminDiscount: bundle.adminDiscount,
                    products: bundle.products.map((prod) => ({
                        productId: prod.productId._id,
                        name: prod.productId.name,
                        quantity: prod.quantity,
                    })),
                };
            }
        });
        res.status(200).json({ wishlistItems });
    }
    catch (error) {
        console.error('Failed to retrieve wishlist items:', error);
        res
            .status(500)
            .json({ message: 'Failed to retrieve wishlist items.', error });
    }
});
exports.getWishlistItems = getWishlistItems;
