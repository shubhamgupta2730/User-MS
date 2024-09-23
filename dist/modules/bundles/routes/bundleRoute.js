"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getBundle_1 = require("../controllers/getBundle");
const getAllBundle_1 = require("../controllers/getAllBundle");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get('/get-bundle', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getBundle_1.getBundleById);
router.get('/get-all-bundles', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getAllBundle_1.getAllBundles);
exports.default = router;
