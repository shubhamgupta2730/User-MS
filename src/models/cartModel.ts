import mongoose, { Schema, Document } from 'mongoose';

interface CartItem {
  productId?: mongoose.Types.ObjectId;
  bundleId?: mongoose.Types.ObjectId;
  quantity: number;
}

interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: CartItem[];
  totalPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for a single cart item
const cartItemSchema = new Schema<CartItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: function () {
      return !this.bundleId;
    }, // Required if no bundleId
  },
  bundleId: {
    type: Schema.Types.ObjectId,
    ref: 'Bundle',
    required: function () {
      return !this.productId;
    }, // Required if no productId
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

// Schema for the Cart document
const cartSchema = new Schema<ICart>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<ICart>('Cart', cartSchema);
