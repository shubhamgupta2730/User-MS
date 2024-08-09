import express from 'express';
const router = express.Router();
import categoryRoutes from '../modules/category/routes/categoryRoutes';
import productRoutes from '../modules/products/routes/productRoutes';
import bundleRoutes from '../modules/bundles/routes/bundleRoute';
import cartRoutes from '../modules/cart/routes/cartRoute';
import wishlistRoutes from '../modules/wishlist/routes/wishlistRoutes';

router.use('/categoryRoute', categoryRoutes);
router.use('/productRoute', productRoutes);
router.use('/bundleRoute', bundleRoutes);
router.use('/cartRoute', cartRoutes);
router.use('/wishlistRoute', wishlistRoutes);

export default router;
