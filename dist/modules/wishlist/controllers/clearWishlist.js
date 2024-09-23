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
exports.clearWishlist = void 0;
const wishlistModel_1 = __importDefault(require("../../../models/wishlistModel"));
const clearWishlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    try {
        const wishlist = yield wishlistModel_1.default.findOne({ userId });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found.' });
        }
        // Clear all items from the wishlist
        wishlist.items = [];
        wishlist.updatedAt = new Date();
        yield wishlist.save();
        res.status(200).json({ message: 'Wishlist cleared successfully.' });
    }
    catch (error) {
        console.error('Failed to clear wishlist:', error);
        res.status(500).json({ message: 'Failed to clear wishlist.', error });
    }
});
exports.clearWishlist = clearWishlist;
