// src/types/express.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      rawBody?: string; // Add rawBody property
    }
  }
}
