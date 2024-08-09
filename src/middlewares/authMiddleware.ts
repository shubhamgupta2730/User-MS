import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

// Middleware to authenticate the user
export const authenticateUser = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: 'user';
    };

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to authorize the user
export const authorizeUser = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role !== 'user') {
    console.error('[Auth Middleware] Access denied: User is not a user');
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};
