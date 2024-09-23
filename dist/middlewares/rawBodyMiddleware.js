"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawBodyParser = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
exports.rawBodyParser = body_parser_1.default.raw({ type: 'application/json' });
// Middleware to store raw body
const rawBodyMiddleware = (req, res, next) => {
    req.rawBody = req.body;
    next();
};
exports.default = rawBodyMiddleware;
