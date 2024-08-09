import { getBundleById } from '../controllers/getBundle';
import { getAllBundles } from '../controllers/getAllBundle';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
import express from 'express';
const router = express.Router();

router.get('/get-bundle', authenticateUser, authorizeUser, getBundleById);
router.get('/get-all-bundles', authenticateUser, authorizeUser, getAllBundles);

export default router;
