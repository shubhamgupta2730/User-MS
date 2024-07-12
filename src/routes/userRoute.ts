import { Router } from 'express';
import {
  registerUser,
  loginUser,
  verifyOtp,
  verifyLoginOtp,
} from '../controllers/userController';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/verify-login-otp', verifyLoginOtp);
export default router;
