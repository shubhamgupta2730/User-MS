"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webHook_1 = __importDefault(require("../controllers/webHook"));
const refundWebhook_1 = __importDefault(require("../controllers/refundWebhook"));
const router = express_1.default.Router();
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), webHook_1.default);
router.post('/refund-webhook', express_1.default.raw({ type: 'application/json' }), refundWebhook_1.default);
exports.default = router;
