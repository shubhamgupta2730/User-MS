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
exports.addToCart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cartModel_1 = __importDefault(require("../../../models/cartModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const addToCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const { productId, bundleId } = req.body;
    if (!productId && !bundleId) {
        return res.status(400).json({
            message: 'Either productId or bundleId must be provided.',
        });
    }
    if (productId && bundleId) {
        return res.status(400).json({
            message: 'Provide only one of productId or bundleId, not both.',
        });
    }
    try {
        let cart = yield cartModel_1.default.findOne({ userId });
        if (!cart) {
            cart = new cartModel_1.default({ userId, items: [] });
        }
        if (productId) {
            if (!mongoose_1.default.isValidObjectId(productId)) {
                return res.status(400).json({ message: 'Invalid product ID.' });
            }
            const product = yield productModel_1.default.findOne({
                _id: productId,
                isActive: true,
                isDeleted: false,
                isBlocked: false,
            });
            if (!product) {
                return res
                    .status(404)
                    .json({ message: 'Product not found or inactive.' });
            }
            const existingProduct = cart.items.find((item) => { var _a; return (_a = item.productId) === null || _a === void 0 ? void 0 : _a.equals(productId); });
            if (!existingProduct) {
                cart.items.push({ productId, quantity: 1 });
            }
        }
        if (bundleId) {
            if (!mongoose_1.default.isValidObjectId(bundleId)) {
                return res.status(400).json({ message: 'Invalid bundle ID.' });
            }
            const bundle = yield bundleProductModel_1.default.findOne({
                _id: bundleId,
                isActive: true,
                isDeleted: false,
                isBlocked: false,
            });
            if (!bundle) {
                return res
                    .status(404)
                    .json({ message: 'Bundle not found or inactive.' });
            }
            const existingBundle = cart.items.find((item) => { var _a; return (_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.equals(bundleId); });
            if (!existingBundle) {
                cart.items.push({ bundleId, quantity: 1 });
            }
        }
        cart.updatedAt = new Date();
        // Calculate total price
        const totalPrice = yield calculateTotalPrice(cart.items);
        cart.totalPrice = totalPrice;
        yield cart.save();
        res.status(200).json({ message: 'Item added to cart successfully.', cart });
    }
    catch (error) {
        console.error('Failed to add item to cart:', error);
        res.status(500).json({ message: 'Failed to add item to cart.', error });
    }
});
exports.addToCart = addToCart;
// Helper function to calculate total price
const calculateTotalPrice = (items) => __awaiter(void 0, void 0, void 0, function* () {
    let totalPrice = 0;
    for (const item of items) {
        if (item.productId) {
            const product = yield productModel_1.default.findById(item.productId);
            if (product) {
                const price = product.sellingPrice > 0 ? product.sellingPrice : product.MRP;
                totalPrice += price * item.quantity;
            }
        }
        else if (item.bundleId) {
            const bundle = yield bundleProductModel_1.default.findById(item.bundleId);
            if (bundle) {
                const price = bundle.sellingPrice > 0 ? bundle.sellingPrice : bundle.MRP;
                totalPrice += price * item.quantity;
            }
        }
    }
    return totalPrice;
});
