import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import bodyParser from 'body-parser';
// import { logger } from './logger';
// import morgan from 'morgan';
// import requestLogger from './middlewares/requestLogger';
import userRoutes from '../src/routes/userRoutes';
import webhookRoute from '../src/modules/payment/routes/webhookRoute';
import { logger } from './logger';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();
app.use('/api/v1/user/paymentRoute', webhookRoute);
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.raw({ type: 'application/json' }));

// Routes
app.use('/api/v1/user', userRoutes);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
