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
exports.getCartItems = void 0;
const cartModel_1 = __importDefault(require("../../../models/cartModel"));
const getCartItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    try {
        const cart = yield cartModel_1.default.findOne({ userId })
            .populate({
            path: 'items',
            populate: [
                {
                    path: 'productId',
                    model: 'Product',
                    select: 'name description MRP sellingPrice',
                },
                {
                    path: 'bundleId',
                    model: 'Bundle',
                    select: 'name description MRP sellingPrice products',
                },
            ],
        })
            .lean();
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for user.' });
        }
        let totalPrice = 0;
        const itemMap = {};
        cart.items.forEach((item) => {
            var _a, _b;
            const id = ((_a = item.productId) === null || _a === void 0 ? void 0 : _a._id) || ((_b = item.bundleId) === null || _b === void 0 ? void 0 : _b._id);
            if (id) {
                const itemPrice = item.productId
                    ? item.productId.sellingPrice
                    : item.bundleId.sellingPrice;
                if (!itemMap[id]) {
                    itemMap[id] = Object.assign(Object.assign({}, item), { quantity: 0, type: item.productId ? 'product' : 'bundle', price: itemPrice });
                }
                itemMap[id].quantity += item.quantity;
                totalPrice += itemPrice * item.quantity;
            }
        });
        const items = Object.values(itemMap).map((item) => {
            if (item.productId) {
                return {
                    id: item.productId._id,
                    name: item.productId.name,
                    description: item.productId.description,
                    MRP: item.productId.MRP,
                    sellingPrice: item.productId.sellingPrice,
                    quantity: item.quantity,
                    type: 'product',
                };
            }
            else if (item.bundleId) {
                return {
                    id: item.bundleId._id,
                    name: item.bundleId.name,
                    description: item.bundleId.description,
                    MRP: item.bundleId.MRP,
                    sellingPrice: item.bundleId.sellingPrice,
                    quantity: item.quantity,
                    products: item.bundleId.products.map((product) => ({
                        productId: product.productId,
                        quantity: product.quantity,
                    })),
                    type: 'bundle',
                };
            }
        });
        res.status(200).json({
            message: 'Cart items retrieved successfully.',
            items,
            totalPrice, // Include the total price in the response
        });
    }
    catch (error) {
        console.error('Failed to retrieve cart items:', error);
        res.status(500).json({ message: 'Failed to retrieve cart items.', error });
    }
});
exports.getCartItems = getCartItems;
