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
const mongoose_1 = __importDefault(require("mongoose"));
const orderModel_1 = __importDefault(require("../../../models/orderModel")); // Updated to use Order model
const cartModel_1 = __importDefault(require("../../../models/cartModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const buyNow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { productId, bundleId } = req.body;
        // Validate that only one of productId or bundleId is provided
        if ((!productId && !bundleId) || (productId && bundleId)) {
            return res.status(400).json({
                message: 'Provide either productId or bundleId, but not both.',
            });
        }
        // Validate ObjectId format for productId
        if (productId && !mongoose_1.default.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid productId format' });
        }
        // Validate ObjectId format for bundleId
        if (bundleId && !mongoose_1.default.Types.ObjectId.isValid(bundleId)) {
            return res.status(400).json({ message: 'Invalid bundleId format' });
        }
        const cart = yield cartModel_1.default.findOne({ userId });
        let orderItems = []; // Define the type according to your actual data structure
        if (productId) {
            const product = yield productModel_1.default.findById(productId);
            if (!product) {
                return res
                    .status(404)
                    .json({ message: `Product with ID ${productId} not found` });
            }
            if (!product.isActive || product.isBlocked || product.isDeleted) {
                return res.status(400).json({
                    message: `Product with ID ${productId} is not available for purchase`,
                });
            }
            if (cart) {
                // Check if the product is in the cart and remove it
                const cartItem = cart.items.find((item) => { var _a; return ((_a = item.productId) === null || _a === void 0 ? void 0 : _a.toString()) === productId; });
                if (cartItem) {
                    yield cartModel_1.default.updateOne({ userId }, { $pull: { items: { productId } } });
                }
            }
            // Add product details to orderItems array
            orderItems.push({
                productId: product._id,
                name: product.name,
                quantity: 1, // Default quantity
                price: product.sellingPrice,
                MRP: product.MRP,
            });
        }
        else if (bundleId) {
            const bundle = yield bundleProductModel_1.default.findById(bundleId).populate({
                path: 'products.productId',
                model: productModel_1.default,
            });
            if (!bundle) {
                return res
                    .status(404)
                    .json({ message: `Bundle with ID ${bundleId} not found` });
            }
            if (cart) {
                // Check if the bundle is in the cart and remove it
                const cartItem = cart.items.find((item) => { var _a; return ((_a = item.bundleId) === null || _a === void 0 ? void 0 : _a.toString()) === bundleId; });
                if (cartItem) {
                    yield cartModel_1.default.updateOne({ userId }, { $pull: { items: { bundleId } } });
                }
            }
            // Add bundle and its products to orderItems array
            const productsInBundle = bundle.products.map((product) => {
                const prod = product.productId;
                return {
                    productId: prod._id,
                    name: prod.name,
                    price: prod.sellingPrice,
                    MRP: prod.MRP,
                };
            });
            orderItems.push({
                bundleId: bundle._id,
                name: bundle.name,
                quantity: 1, // Default quantity
                price: bundle.sellingPrice,
                MRP: bundle.MRP,
                products: productsInBundle,
            });
        }
        if (orderItems.length === 0) {
            return res
                .status(400)
                .json({ message: 'No valid item found to add to the order' });
        }
        // Create and save the Order with a single item
        const order = new orderModel_1.default({
            userId,
            items: orderItems, // Use 'items' field instead of 'item'
            totalAmount: orderItems.reduce((total, item) => total + (item.price * item.quantity), 0),
            status: 'pending',
            paymentStatus: 'unpaid',
            createdAt: new Date(),
            updatedAt: new Date(),
            orderDate: new Date(),
        });
        yield order.save();
        // Send only the essential details in the response
        const { _id, items, totalAmount } = order.toObject(); // Convert document to plain object
        res.status(200).json({
            message: 'Item added successfully',
            order: {
                id: _id,
                items, // Return 'items' instead of 'item'
                totalAmount,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = buyNow;
