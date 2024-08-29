import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAddress } from '../models/userModel';

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: {
    productId?: Types.ObjectId;
    bundleId?: Types.ObjectId;
    quantity: number;
    price: number;
    name: string;
    MRP: number;
  }[];
  totalAmount: number;
  status:
    | 'pending'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'failed';
  paymentStatus: 'unpaid' | 'paid' | 'failed';
  paymentMethod?: 'Card' | 'COD';
  shippingAddress?: IAddress;
  stripePaymentIntentId?: string; // Adding Razorpay order ID
  stripePaymentMethodId?: string;
  createdAt: Date;
  updatedAt: Date;
  orderDate: Date;
  deliveryDate?: Date;
}

const orderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
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
      name: { type: String, required: true },
      MRP: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'failed',
    ],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'failed'],
    default: 'unpaid',
  },
  paymentMethod: {
    type: String,
    enum: ['Card', 'COD'],
    required: false,
  },
  shippingAddress: {
    addressLine1: { type: String, required: false },
    addressLine2: { type: String, required: false },
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    postalCode: { type: String, required: false },
    country: { type: String, required: false },
  },
  stripePaymentIntentId: { type: String, required: false },
  stripePaymentMethodId: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  orderDate: { type: Date, default: Date.now },
  deliveryDate: { type: Date, required: false },
});

export default mongoose.model<IOrder>('Order', orderSchema);
