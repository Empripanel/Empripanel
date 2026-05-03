import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

const allowedOrigins = new Set([
  'https://empripanel.com',
  'https://www.empripanel.com',
  'http://localhost:3000',
  ...(process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
]);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

export default app;

