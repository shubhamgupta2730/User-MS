import express from 'express';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';

import rawBodyMiddleware from '../../../middlewares/rawBodyMiddleware';
import { rawBodyParser } from '../../../middlewares/rawBodyMiddleware';

import createPaymentIntent from '../controllers/capturePayment';
// import verifyPayment from '../controllers/verifyPayment';
import webhookHandler from '../controllers/webHook';
const router = express.Router();
router.post(
  '/capture-payment',
  authenticateUser,
  authorizeUser,
  createPaymentIntent
);

// router.post('/verify-payment', authenticateUser, authorizeUser, verifyPayment);
router.post('/webhook', webhookHandler);

export default router;
