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
exports.clearCart = void 0;
const cartModel_1 = __importDefault(require("../../../models/cartModel"));
const clearCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    try {
        const cart = yield cartModel_1.default.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for user.' });
        }
        // Clear all items from the cart
        cart.items = [];
        cart.updatedAt = new Date();
        yield cart.save();
        res
            .status(200)
            .json({ message: 'All items removed from cart successfully.', cart });
    }
    catch (error) {
        console.error('Failed to clear cart:', error);
        res.status(500).json({ message: 'Failed to clear cart.', error });
    }
});
exports.clearCart = clearCart;
