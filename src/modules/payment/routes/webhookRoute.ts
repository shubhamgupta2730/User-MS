import express from 'express';
import webhookHandler from '../controllers/webHook';
import refundWebhookHandler from '../controllers/refundWebhook';
const router = express.Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

router.post(
  '/refund-webhook',
  express.raw({ type: 'application/json' }),
  refundWebhookHandler
);

export default router;
