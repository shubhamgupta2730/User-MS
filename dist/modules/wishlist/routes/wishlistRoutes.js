"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const addToWishlist_1 = require("../controllers/addToWishlist");
const removeFromWishlist_1 = require("../controllers/removeFromWishlist");
const clearWishlist_1 = require("../controllers/clearWishlist");
const getWishlistItems_1 = require("../controllers/getWishlistItems");
const moveToCartFromWishlist_1 = require("../controllers/moveToCartFromWishlist");
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.post('/add-to-wishlist', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, addToWishlist_1.addToWishlist);
router.delete('/remove-from-wishlist', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, removeFromWishlist_1.removeFromWishlist);
router.delete('/clear-wishlist', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, clearWishlist_1.clearWishlist);
router.get('/get-wishlist', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getWishlistItems_1.getWishlistItems);
router.post('/move-to-cart', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, moveToCartFromWishlist_1.moveItemFromWishlistToCart);
exports.default = router;
