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
exports.removeFromCart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cartModel_1 = __importDefault(require("../../../models/cartModel"));
const removeFromCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const cart = yield cartModel_1.default.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for user.' });
        }
        if (productId) {
            if (!mongoose_1.default.isValidObjectId(productId)) {
                return res.status(400).json({ message: 'Invalid product ID.' });
            }
            const productIndex = cart.items.findIndex((item) => { var _a; return (_a = item.productId) === null || _a === void 0 ? void 0 : _a.equals(productId); });
            if (productIndex === -1) {
                return res.status(404).json({ message: 'Product not found in cart.' });
            }
            // Remove product from cart
            cart.items.splice(productIndex, 1);
        }
        if (bundleId) {
            if (!mongoose_1.default.isValidObjectId(bundleId)) {
                return res.status(400).json({ message: 'Invalid bundle ID.' });
            }
            const bundleIndex = cart.items.findIndex((item) => { var _a; return (_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.equals(bundleId); });
            if (bundleIndex === -1) {
                return res.status(404).json({ message: 'Bundle not found in cart.' });
            }
            // Remove bundle from cart
            cart.items.splice(bundleIndex, 1);
        }
        cart.updatedAt = new Date();
        yield cart.save();
        res
            .status(200)
            .json({ message: 'Item removed from cart successfully.', cart });
    }
    catch (error) {
        console.error('Failed to remove item from cart:', error);
        res
            .status(500)
            .json({ message: 'Failed to remove item from cart.', error });
    }
});
exports.removeFromCart = removeFromCart;
