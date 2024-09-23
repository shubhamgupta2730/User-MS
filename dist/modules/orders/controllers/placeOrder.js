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
const orderModel_1 = __importDefault(require("../../../models/orderModel"));
const userModel_1 = __importDefault(require("../../../models/userModel"));
const validateAddress = (address) => {
    const { addressLine1, street, city, state, postalCode, country } = address;
    if (!addressLine1 || typeof addressLine1 !== 'string' || addressLine1.trim() === '') {
        return 'Address Line 1 is required and should be a non-empty string';
    }
    if (street && typeof street !== 'string') {
        return 'Street should be a string';
    }
    if (city && typeof city !== 'string') {
        return 'City should be a string';
    }
    if (state && typeof state !== 'string') {
        return 'State should be a string';
    }
    if (postalCode && typeof postalCode !== 'string') {
        return 'Postal Code should be a string';
    }
    if (country && typeof country !== 'string') {
        return 'Country should be a string';
    }
    return null;
};
const placeOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { shippingAddress, paymentMethod } = req.body;
        // Validate payment method
        if (!['Credit Card', 'UPI', 'Debit Card', 'COD'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }
        // Validate shipping address
        if (shippingAddress) {
            const validationError = validateAddress(shippingAddress);
            if (validationError) {
                return res.status(400).json({ message: validationError });
            }
        }
        // Retrieve the most recent pending order
        const order = yield orderModel_1.default.findOne({ userId, status: 'pending' })
            .sort({ createdAt: -1 }); // Sort by createdAt in descending order
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Handle shipping address
        let addressToUse;
        if (shippingAddress) {
            // Retrieve the user and check if the address already exists
            const user = yield userModel_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // Check if the provided address already exists in the user's addresses
            const addressExists = user.address.some(addr => addr.addressLine1 === shippingAddress.addressLine1 &&
                addr.street === shippingAddress.street &&
                addr.city === shippingAddress.city &&
                addr.state === shippingAddress.state &&
                addr.postalCode === shippingAddress.postalCode &&
                addr.country === shippingAddress.country);
            if (!addressExists) {
                // Add the address to the user's addresses if it's new
                yield userModel_1.default.updateOne({ _id: userId }, { $push: { address: shippingAddress } });
            }
            addressToUse = shippingAddress;
        }
        else {
            const user = yield userModel_1.default.findById(userId);
            if (!user || user.address.length === 0) {
                return res.status(400).json({ message: 'No address available' });
            }
            addressToUse = user.address[user.address.length - 1];
        }
        order.shippingAddress = addressToUse;
        order.paymentMethod = paymentMethod;
        yield order.save();
        res.status(200).json({
            message: 'Order placed successfully',
            order: {
                _id: order._id,
                userId: order.userId,
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                totalAmount: order.totalAmount,
                status: order.status
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal Server Error', error });
    }
});
exports.default = placeOrder;
