import { Request, Response } from 'express';
import { publishToQueue } from '../rabbitMQ/producer';
import logger from '../logger';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

//! register user controller:

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

//! login user controller:

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (!user || !user.isVerified) {
      res
        .status(400)
        .json({ message: 'Invalid email or account not verified.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    if (user.authMethod === 'email') {
      const otpMessage = { operation: 'send_otp', data: { email } };
      await publishToQueue('auth_operations', otpMessage);
      return res.status(200).json({ message: 'OTP sent to email' });
    } else if (user.authMethod === 'phone') {
      const otpMessage = {
        operation: 'send_otp_phone',
        data: { phone: user.phone },
      };
      await publishToQueue('auth_operations', otpMessage);
      return res.status(200).json({ message: 'OTP sent to phone number.' });
    } else if (user.authMethod === 'authenticator') {
      return res
        .status(200)
        .json({ message: 'Enter OTP from authenticator app' });
    }
  } catch (error) {
    const err = error as Error;
    logger.error(`Error logging in user: ${err.message}`);
    res.status(500).json({ error: 'Failed to login user' });
  }
};

//!verify otp during registration controller:

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

//! verify otp for login controller:
export const verifyLoginOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const verifyOtpMessage = {
      operation: 'verify_login_otp',
      data: { email, otp },
    };

    const response = await publishToQueue('auth_operations', verifyOtpMessage);
    
    if (response.statusCode === 200) {
      return res.status(200).json(response.body);
    } else {
      return res.status(response.statusCode).json(response.body);
    }
  } catch (error) {
    const err = error as Error;
    logger.error(`Error verifying OTP: ${err.message}`);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};