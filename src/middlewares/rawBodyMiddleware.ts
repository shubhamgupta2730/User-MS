import { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

export const rawBodyParser = bodyParser.raw({ type: 'application/json' });

// Middleware to store raw body
const rawBodyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.rawBody = req.body;
  next();
};

export default rawBodyMiddleware;
