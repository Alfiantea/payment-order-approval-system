import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

import authRoutes from './routes/auth';

import dashboardRoutes from './routes/dashboard';

// Routes
app.use('/auth', authRoutes);
import paymentRoutes from './routes/payment';
import userRoutes from './routes/users';

app.use('/dashboard', dashboardRoutes);
app.use('/payment-orders', paymentRoutes);
import adminRoutes from './routes/admin';

app.use('/users', userRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
