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
exports.getBundleById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const getBundleById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const bundleId = req.query.id;
    if (!bundleId) {
        return res.status(400).json({ message: 'Bundle ID is required' });
    }
    if (!mongoose_1.default.isValidObjectId(bundleId)) {
        return res.status(400).json({ message: 'Invalid Bundle ID' });
    }
    try {
        const bundle = yield bundleProductModel_1.default.findById(bundleId)
            .populate({
            path: 'products.productId',
            select: 'name MRP sellingPrice discount adminDiscount categoryId',
            populate: {
                path: 'categoryId',
                select: 'name description',
            },
        })
            .select('name description MRP sellingPrice discount adminDiscount products createdBy');
        if (!bundle) {
            return res.status(404).json({ message: 'Bundle not found' });
        }
        const products = bundle.products.map((bundleProduct) => {
            var _a, _b, _c;
            const product = bundleProduct.productId;
            return {
                _id: product._id,
                name: product.name,
                MRP: product.MRP,
                sellingPrice: product.sellingPrice,
                quantity: bundleProduct.quantity,
                discount: product.discount,
                adminDiscount: product.adminDiscount,
                category: {
                    _id: (_a = product.categoryId) === null || _a === void 0 ? void 0 : _a._id,
                    name: (_b = product.categoryId) === null || _b === void 0 ? void 0 : _b.name,
                    description: (_c = product.categoryId) === null || _c === void 0 ? void 0 : _c.description,
                },
            };
        });
        const response = {
            _id: bundle._id,
            name: bundle.name,
            description: bundle.description,
            MRP: bundle.MRP,
            sellingPrice: bundle.sellingPrice,
            discount: bundle.discount,
            adminDiscount: bundle.adminDiscount,
            products,
        };
        res.status(200).json({
            message: 'Bundle fetched successfully',
            bundle: response,
        });
    }
    catch (error) {
        console.error('Failed to fetch bundle:', error);
        res.status(500).json({ message: 'Failed to fetch bundle', error });
    }
});
exports.getBundleById = getBundleById;
