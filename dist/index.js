"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
// import { logger } from './logger';
// import morgan from 'morgan';
// import requestLogger from './middlewares/requestLogger';
const userRoutes_1 = __importDefault(require("../src/routes/userRoutes"));
const webhookRoute_1 = __importDefault(require("../src/modules/payment/routes/webhookRoute"));
const logger_1 = require("./logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to database
(0, db_1.default)();
app.use('/api/v1/user/paymentRoute', webhookRoute_1.default);
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.raw({ type: 'application/json' }));
// Routes
app.use('/api/v1/user', userRoutes_1.default);
app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on http://localhost:${PORT}`);
});
