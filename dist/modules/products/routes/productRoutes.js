"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getProduct_1 = require("../controllers/getProduct");
const getAllProducts_1 = require("../controllers/getAllProducts");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/get-product', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getProduct_1.getProductById);
router.get('/get-all-products', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getAllProducts_1.getAllProducts);
exports.default = router;
