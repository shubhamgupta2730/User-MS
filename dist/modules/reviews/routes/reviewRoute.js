"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const addReview_1 = __importDefault(require("../controllers/addReview"));
const deleteReview_1 = __importDefault(require("../controllers/deleteReview"));
const getReview_1 = __importDefault(require("../controllers/getReview"));
const updateReview_1 = __importDefault(require("../controllers/updateReview"));
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const router = express_1.default.Router();
router.post('/add-review', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, addReview_1.default);
router.delete('/delete-review', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, deleteReview_1.default);
router.get('/get-review', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, getReview_1.default);
router.patch('/update-review', authMiddleware_1.authenticateUser, authMiddleware_1.authorizeUser, updateReview_1.default);
exports.default = router;
