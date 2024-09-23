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
exports.getAllCategories = void 0;
const categoryModel_1 = __importDefault(require("../../../models/categoryModel"));
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, sortBy = 'name', order = 'asc', limit = 10, page = 1, } = req.query;
        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }
        const sortOrder = order === 'desc' ? -1 : 1;
        const sortOptions = { [sortBy]: sortOrder };
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        const skip = (pageNumber - 1) * pageSize;
        // Fetch categories with pagination, sorting, and filtering
        const categories = yield categoryModel_1.default.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize)
            .lean();
        // Count total categories based on the filter
        const totalCategories = yield categoryModel_1.default.countDocuments(filter);
        // Format the response
        const formattedCategories = categories.map((category) => ({
            _id: category._id,
            name: category.name,
            description: category.description,
        }));
        res.status(200).json({
            message: 'Categories fetched successfully',
            categories: formattedCategories,
            totalCategories,
            totalPages: Math.ceil(totalCategories / pageSize),
            currentPage: pageNumber,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch categories', error });
    }
});
exports.getAllCategories = getAllCategories;
