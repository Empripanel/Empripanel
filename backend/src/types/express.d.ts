import 'express';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        role: string;
      };
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
        createdAt: Date;
      };
    }
  }
}

export {};

