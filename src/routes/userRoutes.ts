import express from 'express';
const router = express.Router();
import categoryRoutes from '../modules/category/routes/categoryRoutes';
import productRoutes from '../modules/products/routes/productRoutes';
import bundleRoutes from '../modules/bundles/routes/bundleRoute';
router.use('/categoryRoute', categoryRoutes);
router.use('/productRoute', productRoutes);
router.use('/bundleRoute', bundleRoutes);

export default router;
