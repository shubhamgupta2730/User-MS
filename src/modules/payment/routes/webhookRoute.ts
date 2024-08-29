import express from 'express';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';

import rawBodyMiddleware from '../../../middlewares/rawBodyMiddleware';
import { rawBodyParser } from '../../../middlewares/rawBodyMiddleware';

// import verifyPayment from '../controllers/verifyPayment';
import webhookHandler from '../controllers/webHook';
const router = express.Router();

// router.post('/verify-payment', authenticateUser, authorizeUser, verifyPayment);
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

export default router;
