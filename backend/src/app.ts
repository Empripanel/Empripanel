import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

const frontendOrigin = process.env.FRONTEND_URL ?? 'http://localhost:3000';

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);

app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

export default app;

