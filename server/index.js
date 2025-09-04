// ...removed duplicate 'cors' import...
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import orderRoutes from './routes/order.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import logCategoryBody from './middleware/logCategoryBody.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Security & UX middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: ['http://localhost:5173', 'http://192.168.1.35:5173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

// Serve uploads statically with CORS and CORP headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Optional request logger for category
app.use('/api/admin/categories', logCategoryBody);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, process.env.HOST || '0.0.0.0', () => console.log('Server running on port', PORT));
  })
  .catch(err => console.error(err));
