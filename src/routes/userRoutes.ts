import express from 'express';
const router = express.Router();
import categoryRoutes from '../modules/category/routes/categoryRoutes';
import productRoutes from '../modules/products/routes/productRoutes';
import bundleRoutes from '../modules/bundles/routes/bundleRoute';
import cartRoutes from '../modules/cart/routes/cartRoute';
import wishlistRoutes from '../modules/wishlist/routes/wishlistRoutes';
import homepageRoutes from '../modules/homepage/routes/homepageRoute';
import orderRoutes from '../modules/orders/routes/orderRoutes';
import paymentRoutes from '../modules/payment/routes/paymentRoute';

router.use('/categoryRoute', categoryRoutes);
router.use('/productRoute', productRoutes);
router.use('/bundleRoute', bundleRoutes);
router.use('/cartRoute', cartRoutes);
router.use('/wishlistRoute', wishlistRoutes);
router.use('/homepageRoute', homepageRoutes);
router.use('/orderRoute', orderRoutes);
router.use('/paymentRoute', paymentRoutes);

export default router;
