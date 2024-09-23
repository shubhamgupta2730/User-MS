"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getCategory_1 = require("../controllers/getCategory");
const getAllCategory_1 = require("../controllers/getAllCategory");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/get-category', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getCategory_1.getCategory);
router.get('/get-all-categories', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getAllCategory_1.getAllCategories);
exports.default = router;
