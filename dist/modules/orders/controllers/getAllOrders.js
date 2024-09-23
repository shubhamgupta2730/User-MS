"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = void 0;
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const mongoose_1 = __importDefault(require("mongoose"));
const validSortFields = ['createdAt', 'totalAmount', 'status'];
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { search = '', sortBy = 'createdAt', order = 'desc', page = 1, limit = 10, } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const sortField = sortBy;
        const sortOrder = order === 'desc' ? -1 : 1;
        const pipeline = [
            { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
            {
                $match: {
                    $or: [
                        { 'items.productId': { $regex: search, $options: 'i' } },
                        { 'items.bundleId': { $regex: search, $options: 'i' } },
                        { status: { $regex: search, $options: 'i' } },
                    ],
                },
            },
            { $sort: { [sortField]: sortOrder } },
            { $skip: (pageNumber - 1) * limitNumber },
            { $limit: limitNumber },
            {
                $project: {
                    orderId: '$_id',
                    userId: 1,
                    totalAmount: 1,
                    status: 1,
                    orderDate: {
                        $dateToString: {
                            format: '%Y-%m-%d %H:%M:%S',
                            date: '$createdAt',
                            timezone: 'Asia/Kolkata',
                        },
                    },
                },
            },
        ];
        const orders = yield orderModel_1.default.aggregate(pipeline);
        const totalOrdersPipeline = [
            { $match: { userId: new mongoose_1.default.Types.ObjectId(userId) } },
            {
                $match: {
                    $or: [
                        { 'items.productId': { $regex: search, $options: 'i' } },
                        { 'items.bundleId': { $regex: search, $options: 'i' } },
                        { status: { $regex: search, $options: 'i' } },
                    ],
                },
            },
            { $count: 'totalOrders' },
        ];
        const totalOrdersResult = yield orderModel_1.default.aggregate(totalOrdersPipeline);
        const totalOrders = ((_b = totalOrdersResult[0]) === null || _b === void 0 ? void 0 : _b.totalOrders) || 0;
        res.status(200).json({
            totalOrders,
            totalPages: Math.ceil(totalOrders / limitNumber),
            currentPage: pageNumber,
            orders,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.getAllOrders = getAllOrders;
