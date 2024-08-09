import mongoose, { Schema, Document, Types } from 'mongoose';

interface WishlistItem {
  productId?: Types.ObjectId;
  bundleId?: Types.ObjectId;
}

interface IWishlist extends Document {
  userId: Schema.Types.ObjectId;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<WishlistItem>({
  productId: {
    type: Types.ObjectId,
    ref: 'Product',
    required: function () {
      return !this.bundleId;
    },
  },
  bundleId: {
    type: Types.ObjectId,
    ref: 'Bundle',
    required: function () {
      return !this.productId;
    },
  },
});

const wishlistSchema = new Schema<IWishlist>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [wishlistItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
