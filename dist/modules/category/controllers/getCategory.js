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
exports.getCategory = void 0;
const categoryModel_1 = __importDefault(require("../../../models/categoryModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const mongoose_1 = require("mongoose");
const getCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categoryId = req.query.id;
    if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID' });
    }
    try {
        const category = yield categoryModel_1.default.findById(categoryId);
        if (!category || !category.isActive) {
            return res
                .status(404)
                .json({ message: 'Category not found or inactive' });
        }
        const products = yield productModel_1.default.find({
            categoryId: categoryId,
            isActive: true,
            isDeleted: false,
            isBlocked: false,
        }, '_id name description MRP sellingPrice discount adminDiscount quantity');
        const bundles = yield bundleProductModel_1.default.find({ isActive: true, isDeleted: false, isBlocked: false }, '_id name description MRP sellingPrice discount adminDiscount products');
        return res.status(200).json({
            categoryName: category.name,
            categoryDescription: category.description,
            products,
            bundles,
        });
    }
    catch (error) {
        console.error('Error fetching products by category ID:', error);
        return res
            .status(500)
            .json({ message: 'Failed to fetch products and bundles', error });
    }
});
exports.getCategory = getCategory;
