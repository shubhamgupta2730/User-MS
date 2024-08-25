import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';
import Category from '../../../models/categoryModel';

export const getHotDeals = async (req: Request, res: Response) => {
  try {
    const activeProducts = await Product.find({
      isActive: true,
      isDeleted: false,
      isBlocked: false,
    });
    const activeBundles = await Bundle.find({
      isActive: true,
      isDeleted: false,
      isBlocked: false,
    });

    const processedProducts = await Promise.all(
      activeProducts.map(async (product) => {
        const category = await Category.findById(product.categoryId).select(
          'name'
        );
        const effectiveDiscount = Math.round(
          ((product.MRP - product.sellingPrice) / product.MRP) * 100
        );

        return {
          _id: product._id,
          name: product.name,
          description: product.description,
          MRP: product.MRP,
          sellingPrice: product.sellingPrice,
          categoryId: product.categoryId,
          categoryName: category ? category.name : 'Unknown',
          effectiveDiscount,
        };
      })
    );

    const processedBundles = await Promise.all(
      activeBundles.map(async (bundle) => {
        const effectiveDiscount = Math.round(
          ((bundle.MRP - bundle.sellingPrice) / bundle.MRP) * 100
        );

        const bundleProducts = await Promise.all(
          bundle.products.map(async (bundleProduct) => {
            const product = await Product.findById(
              bundleProduct.productId
            ).select('name');
            return {
              productId: bundleProduct.productId,
              productName: product ? product.name : 'Unknown',
            };
          })
        );

        return {
          _id: bundle._id,
          name: bundle.name,
          description: bundle.description,
          MRP: bundle.MRP,
          sellingPrice: bundle.sellingPrice,
          effectiveDiscount,
          products: bundleProducts,
        };
      })
    );

    const hotDeals = [...processedProducts, ...processedBundles]
      .sort((a, b) => b.effectiveDiscount - a.effectiveDiscount)
      .slice(0, 30);
    res.status(200).json({
      message: 'Hot Deals retrieved successfully',
      data: hotDeals,
    });
  } catch (error) {
    console.error('Failed to retrieve hot deals', error);
    res.status(500).json({ message: 'Server error', error });
  }
};
