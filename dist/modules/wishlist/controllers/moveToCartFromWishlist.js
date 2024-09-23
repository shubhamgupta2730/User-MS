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
exports.moveItemFromWishlistToCart = void 0;
const wishlistModel_1 = __importDefault(require("../../../models/wishlistModel"));
const cartModel_1 = __importDefault(require("../../../models/cartModel"));
const moveItemFromWishlistToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const { productId, bundleId } = req.body;
    if (!productId && !bundleId) {
        return res
            .status(400)
            .json({ message: 'Either productId or bundleId must be provided.' });
    }
    if (productId && bundleId) {
        return res.status(400).json({
            message: 'Provide only one of productId or bundleId, not both.',
        });
    }
    try {
        // Step 1: Check if the item exists in the wishlist
        const wishlist = yield wishlistModel_1.default.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found.' });
        }
        let itemToMove;
        if (productId) {
            itemToMove = wishlist.items.find((item) => { var _a; return (_a = item.productId) === null || _a === void 0 ? void 0 : _a.equals(productId); });
        }
        else if (bundleId) {
            itemToMove = wishlist.items.find((item) => { var _a; return (_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.equals(bundleId); });
        }
        if (!itemToMove) {
            return res.status(404).json({ message: 'Item not found in wishlist.' });
        }
        // Step 2: Check if a cart exists; if not, create one
        let cart = yield cartModel_1.default.findOne({ userId });
        if (!cart) {
            cart = new cartModel_1.default({ userId, items: [] });
        }
        // Step 3: Add the item to the cart
        if (productId) {
            const existingProduct = cart.items.find((item) => { var _a; return (_a = item.productId) === null || _a === void 0 ? void 0 : _a.equals(productId); });
            if (existingProduct) {
                existingProduct.quantity += 1;
            }
            else {
                cart.items.push({ productId, quantity: 1 });
            }
        }
        if (bundleId) {
            const existingBundle = cart.items.find((item) => { var _a; return (_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.equals(bundleId); });
            if (existingBundle) {
                existingBundle.quantity += 1;
            }
            else {
                cart.items.push({ bundleId, quantity: 1 });
            }
        }
        // Step 4: Remove the item from the wishlist
        wishlist.items = wishlist.items.filter((item) => {
            var _a, _b;
            return (productId && !((_a = item.productId) === null || _a === void 0 ? void 0 : _a.equals(productId))) ||
                (bundleId && !((_b = item.bundleId) === null || _b === void 0 ? void 0 : _b.equals(bundleId)));
        });
        // Save the updated wishlist
        yield wishlist.save();
        // Save the updated cart
        yield cart.save();
        // Calculate the total price of the cart
        let totalPrice = 0;
        const updatedCart = yield cartModel_1.default.findOne({ userId })
            .populate({
            path: 'items',
            populate: [
                {
                    path: 'productId',
                    model: 'Product',
                    select: 'sellingPrice',
                },
                {
                    path: 'bundleId',
                    model: 'Bundle',
                    select: 'sellingPrice',
                },
            ],
        })
            .lean();
        if (updatedCart) {
            updatedCart.items.forEach((item) => {
                const price = item.productId
                    ? item.productId.sellingPrice
                    : item.bundleId.sellingPrice;
                totalPrice += price * item.quantity;
            });
        }
        res.status(200).json({
            message: 'Item moved from wishlist to cart successfully.',
        });
    }
    catch (error) {
        console.error('Failed to move item from wishlist to cart:', error);
        res
            .status(500)
            .json({ message: 'Failed to move item from wishlist to cart.', error });
    }
});
exports.moveItemFromWishlistToCart = moveItemFromWishlistToCart;
