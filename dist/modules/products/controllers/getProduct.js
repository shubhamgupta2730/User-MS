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
exports.getProductById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const userModel_1 = __importDefault(require("../../../models/userModel"));
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const productId = req.query.id;
    if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
    }
    if (!mongoose_1.default.isValidObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid Product ID' });
    }
    try {
        const product = yield productModel_1.default.findById(productId)
            .populate({
            path: 'categoryId',
            select: 'name description',
        })
            .select('name description MRP sellingPrice quantity discount adminDiscount categoryId isActive isBlocked isDeleted createdBy createdAt updatedAt');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const seller = yield userModel_1.default.findOne({ _id: product.createdBy }).select('firstName lastName');
        if (!seller) {
            return res.status(404).json({ message: 'Seller not found' });
        }
        const category = product.categoryId;
        // Structure the response
        const response = {
            _id: product._id,
            name: product.name,
            description: product.description,
            MRP: product.MRP,
            sellingPrice: product.sellingPrice,
            quantity: product.quantity,
            discount: product.discount,
            adminDiscount: product.adminDiscount,
            category: {
                _id: category._id,
                name: category.name,
                description: category.description,
            },
            seller: {
                name: `${seller.firstName} ${seller.lastName}`,
            },
        };
        res.status(200).json({
            message: 'Product fetched successfully',
            product: response,
        });
    }
    catch (error) {
        console.error('Failed to fetch product:', error);
        res.status(500).json({ message: 'Failed to fetch product', error });
    }
});
exports.getProductById = getProductById;
