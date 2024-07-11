import { Request, Response } from 'express';
import { publishToQueue } from '../rabbitMQ/producer';
import logger from '../logger';
import User from '../models/user';
import bcrypt from 'bcryptjs';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password || !phone) {
      return res.status(400).json({
        error: 'All fields (username, email, password, phone) are required',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      isVerified: false,
    });
    await newUser.save();

    // Publish message to RabbitMQ queue for sending OTP
    const otpMessage = { operation: 'send_otp', data: { email } };
    await publishToQueue('auth_operations', otpMessage);

    res.status(201).json({ message: ' Please check your email for the OTP.' });
  } catch (error) {
    const err = error as Error;
    logger.error(`Error creating user: ${err.message}`);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Perform login operation (for example, check credentials)
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Publish message to RabbitMQ queue for login operation
    const loginMessage = { operation: 'login', data: { email, password } };
    await publishToQueue('auth_operations', loginMessage);

    res
      .status(200)
      .json({ message: 'Login request sent to authentication service' });
  } catch (error) {
    const err = error as Error;
    logger.error(`Error logging in user: ${err.message}`);
    res.status(500).json({ error: 'Failed to login user' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Publish message to RabbitMQ queue for verifying OTP
    const verifyOtpMessage = { operation: 'verify_otp', data: { email, otp } };

    const response = await publishToQueue('auth_operations', verifyOtpMessage);

    if (response.error) {
      res.status(400).json({ error: response.error });
    } else {
      res.status(200).json({ message: response.message });
    }
  } catch (error) {
    const err = error as Error;
    logger.error(`Error verifying OTP: ${err.message}`);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};
