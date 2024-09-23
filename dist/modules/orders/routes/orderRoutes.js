"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const placeOrder_1 = __importDefault(require("../controllers/placeOrder"));
const getOrderDetails_1 = __importDefault(require("../controllers/getOrderDetails"));
const getAllOrders_1 = require("../controllers/getAllOrders");
const buyNow_1 = __importDefault(require("../controllers/buyNow"));
const cartCheckout_1 = __importDefault(require("../controllers/cartCheckout"));
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.post('/place-order', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, placeOrder_1.default);
router.get('/get-order-details', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getOrderDetails_1.default);
router.get('/get-all-orders', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getAllOrders_1.getAllOrders);
router.post('/buy-now', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, buyNow_1.default);
router.post('/cart-checkout', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, cartCheckout_1.default);
exports.default = router;
