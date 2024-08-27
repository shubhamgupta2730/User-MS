import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAddress } from '../models/userModel';

interface OrderItem {
  productId?: Types.ObjectId;
  bundleId?: Types.ObjectId;
  quantity: number;
  price: number;
}

interface IOrder extends Document {
  userId: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'failed';
  paymentMethod: 'UPI' | 'debit_card' | 'credit_card' | 'COD';
  shippingAddress: IAddress;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
  bundleId: {
    type: Schema.Types.ObjectId,
    ref: 'Bundle',
    required: false,
  },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed'],
    default: 'unpaid',
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'UPI', 'debit_card', 'COD'],
    required: true,
  },
  shippingAddress: {
    type: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IOrder>('Order', orderSchema);
