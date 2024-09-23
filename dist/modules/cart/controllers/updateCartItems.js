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
exports.updateCartItems = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cartModel_1 = __importDefault(require("../../../models/cartModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
// Helper function to calculate the total price
const calculateTotalPrice = (cart) => __awaiter(void 0, void 0, void 0, function* () {
    let totalPrice = 0;
    for (const item of cart.items) {
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
const updateCartItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    const { productId, bundleId, quantity } = req.body;
    // Validate that either productId or bundleId is provided, but not both
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
        // Find the user's cart
        const cart = yield cartModel_1.default.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for user.' });
        }
        let itemUpdated = false;
        // Update quantity for the product if productId is provided
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
            if (existingProduct) {
                existingProduct.quantity = quantity;
                itemUpdated = true;
            }
            else {
                return res.status(404).json({ message: 'Product not found in cart.' });
            }
        }
        // Update quantity for the bundle if bundleId is provided
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
            if (existingBundle) {
                existingBundle.quantity = quantity;
                itemUpdated = true;
            }
            else {
                return res.status(404).json({ message: 'Bundle not found in cart.' });
            }
        }
        if (!itemUpdated) {
            return res.status(400).json({ message: 'No items were updated.' });
        }
        // Calculate the new total price of the cart
        cart.totalPrice = yield calculateTotalPrice(cart);
        cart.updatedAt = new Date();
        // Save the cart with the updated information
        yield cart.save();
        res.status(200).json({ message: 'Cart items updated successfully.', cart });
    }
    catch (error) {
        console.error('Failed to update cart items:', error);
        res.status(500).json({ message: 'Failed to update cart items.', error });
    }
});
exports.updateCartItems = updateCartItems;
