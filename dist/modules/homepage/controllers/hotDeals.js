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
exports.getHotDeals = void 0;
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const categoryModel_1 = __importDefault(require("../../../models/categoryModel"));
const getHotDeals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeProducts = yield productModel_1.default.find({
            isActive: true,
            isDeleted: false,
            isBlocked: false,
        });
        const activeBundles = yield bundleProductModel_1.default.find({
            isActive: true,
            isDeleted: false,
            isBlocked: false,
        });
        const processedProducts = yield Promise.all(activeProducts.map((product) => __awaiter(void 0, void 0, void 0, function* () {
            const category = yield categoryModel_1.default.findById(product.categoryId).select('name');
            const effectiveDiscount = Math.round(((product.MRP - product.sellingPrice) / product.MRP) * 100);
            return {
                _id: product._id,
                name: product.name,
                description: product.description,
                MRP: product.MRP,
                sellingPrice: product.sellingPrice,
                categoryId: product.categoryId,
                categoryName: category ? category.name : 'Unknown',
                effectiveDiscount,
            };
        })));
        const processedBundles = yield Promise.all(activeBundles.map((bundle) => __awaiter(void 0, void 0, void 0, function* () {
            const effectiveDiscount = Math.round(((bundle.MRP - bundle.sellingPrice) / bundle.MRP) * 100);
            const bundleProducts = yield Promise.all(bundle.products.map((bundleProduct) => __awaiter(void 0, void 0, void 0, function* () {
                const product = yield productModel_1.default.findById(bundleProduct.productId).select('name');
                return {
                    productId: bundleProduct.productId,
                    productName: product ? product.name : 'Unknown',
                };
            })));
            return {
                _id: bundle._id,
                name: bundle.name,
                description: bundle.description,
                MRP: bundle.MRP,
                sellingPrice: bundle.sellingPrice,
                effectiveDiscount,
                products: bundleProducts,
            };
        })));
        const hotDeals = [...processedProducts, ...processedBundles]
            .sort((a, b) => b.effectiveDiscount - a.effectiveDiscount)
            .slice(0, 30);
        res.status(200).json({
            message: 'Hot Deals retrieved successfully',
            data: hotDeals,
        });
    }
    catch (error) {
        console.error('Failed to retrieve hot deals', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getHotDeals = getHotDeals;
