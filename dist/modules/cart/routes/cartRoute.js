"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const addToCart_1 = require("../controllers/addToCart");
const removeFromCart_1 = require("../controllers/removeFromCart");
const removeAllItems_1 = require("../controllers/removeAllItems");
const getCartItems_1 = require("../controllers/getCartItems");
const updateCartItems_1 = require("../controllers/updateCartItems");
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.post('/add-to-cart', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, addToCart_1.addToCart);
router.post('/remove-from-cart', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, removeFromCart_1.removeFromCart);
router.post('/clear-cart', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, removeAllItems_1.clearCart);
router.get('/get-cart-items', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getCartItems_1.getCartItems);
router.put('/update-cart-items', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, updateCartItems_1.updateCartItems);
exports.default = router;
