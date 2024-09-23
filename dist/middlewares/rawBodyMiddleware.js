"use strict";
// src/middlewares/rawBodyMiddleware.ts
Object.defineProperty(exports, "__esModule", { value: true });
const rawBodyMiddleware = (req, res, next) => {
    req.rawBody = '';
    req.on('data', chunk => {
        req.rawBody += chunk.toString();
    });
    req.on('end', () => {
        next();
    });
};
exports.default = rawBodyMiddleware;
