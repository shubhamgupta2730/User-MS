import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import logger from './logger';
import userRoutes from './routes/userRoute';
import { connectRabbitMQ } from './rabbitMQ/producer';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

connectRabbitMQ();
// startConsumer();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/user', userRoutes);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
