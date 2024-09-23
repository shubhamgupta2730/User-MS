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
exports.getAllProducts = void 0;
const productModel_1 = __importDefault(require("../../../models/productModel"));
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = req.query.page || '1';
        const limit = req.query.limit || '10';
        const search = req.query.search || '';
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const sortOptions = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };
        const searchFilter = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
        const products = yield productModel_1.default.find(searchFilter)
            .populate({
            path: 'categoryId',
            select: 'name',
        })
            .sort(sortOptions)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .select('name MRP sellingPrice categoryId');
        const totalProducts = yield productModel_1.default.countDocuments(searchFilter);
        const response = products.map((product) => {
            const category = product.categoryId;
            return {
                _id: product._id,
                name: product.name,
                MRP: product.MRP,
                sellingPrice: product.sellingPrice,
                category: {
                    _id: category._id,
                    name: category.name,
                },
            };
        });
        res.status(200).json({
            message: 'Products fetched successfully',
            products: response,
            totalProducts,
            currentPage: pageNum,
            totalPages: Math.ceil(totalProducts / limitNum),
        });
    }
    catch (error) {
        console.error('Failed to fetch products:', error);
        res.status(500).json({ message: 'Failed to fetch products', error });
    }
});
exports.getAllProducts = getAllProducts;
