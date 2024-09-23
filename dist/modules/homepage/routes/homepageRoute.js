"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const hotDeals_1 = require("../controllers/hotDeals");
const getSale_1 = require("../controllers/getSale");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/get-hot-deals', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, hotDeals_1.getHotDeals);
router.get('/get-sale', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getSale_1.getSale);
exports.default = router;
