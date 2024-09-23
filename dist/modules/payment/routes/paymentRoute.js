"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const rawBodyMiddleware_1 = __importDefault(require("../../../middlewares/rawBodyMiddleware"));
const capturePayment_1 = __importDefault(require("../controllers/capturePayment"));
const verifyPayment_1 = __importDefault(require("../controllers/verifyPayment"));
const webHook_1 = __importDefault(require("../controllers/webHook"));
const router = express_1.default.Router();
router.post('/capture-payment', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, capturePayment_1.default);
router.post('/verify-payment', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, verifyPayment_1.default);
router.post('/webhook', rawBodyMiddleware_1.default, express_1.default.json(), webHook_1.default);
exports.default = router;
