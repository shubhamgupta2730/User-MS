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
const orderModel_1 = __importDefault(require("../../../models/orderModel")); // Updated to use Order model
const cartModel_1 = __importDefault(require("../../../models/cartModel"));
const productModel_1 = __importDefault(require("../../../models/productModel"));
const bundleProductModel_1 = __importDefault(require("../../../models/bundleProductModel"));
const cartCheckout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Find the user's cart
        const cart = yield cartModel_1.default.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        // Check if the cart is empty
        if (cart.items.length === 0) {
            return res.status(400).json({
                message: 'Cart is empty. Please add items to the cart first.',
            });
        }
        // Collect all items for the order
        const orderItems = [];
        let totalAmount = 0;
        for (const item of cart.items) {
            if (item.productId) {
                // Handle product
                const product = yield productModel_1.default.findById(item.productId);
                if (!product) {
                    continue;
                }
                const itemTotal = product.sellingPrice * item.quantity;
                // Add product details to orderItems array
                orderItems.push({
                    productId: product._id,
                    name: product.name,
                    quantity: item.quantity,
                    price: product.sellingPrice,
                    MRP: product.MRP,
                });
                totalAmount += itemTotal;
            }
            else if (item.bundleId) {
                // Handle bundle
                const bundle = yield bundleProductModel_1.default.findById(item.bundleId).populate({
                    path: 'products.productId',
                    model: productModel_1.default,
                });
                if (!bundle) {
                    continue;
                }
                const bundleTotal = bundle.sellingPrice * item.quantity;
                const productsInBundle = bundle.products.map((prod) => {
                    const product = prod.productId;
                    return {
                        productId: product._id,
                        name: product.name,
                        price: product.sellingPrice,
                        MRP: product.MRP,
                    };
                });
                // Add bundle and products details to orderItems array
                orderItems.push({
                    bundleId: bundle._id,
                    name: bundle.name,
                    quantity: item.quantity,
                    price: bundle.sellingPrice,
                    MRP: bundle.MRP,
                    products: productsInBundle,
                });
                totalAmount += bundleTotal;
            }
        }
        const order = new orderModel_1.default({
            userId,
            items: orderItems,
            totalAmount,
            status: 'pending',
            paymentStatus: 'unpaid',
        });
        yield order.save();
        // Remove all items from the cart
        yield cartModel_1.default.updateOne({ userId }, { $set: { items: [] } });
        // Prepare response with only necessary information
        const responseOrder = {
            _id: order._id,
            userId: order.userId,
            totalAmount: order.totalAmount,
            items: order.items.map(item => ({
                productId: item.productId,
                bundleId: item.bundleId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                MRP: item.MRP,
            })),
        };
        res.status(200).json({ message: 'Checkout successful', order: responseOrder });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = cartCheckout;
