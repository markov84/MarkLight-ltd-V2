  tls: { rejectUnauthorized: false }
import dotenv from 'dotenv';
dotenv.config();

// Sentry monitoring
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN || '', // добави DSN в .env
  tracesSampleRate: 1.0,
});
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';


import authRoutes from './routes/auth.js';
import productRoutes from './routes/product.js';
import orderRoutes from './routes/order.js';
import adminRoutes from './routes/admin.js';
import { auth } from './utils/auth.js';
import contactRoutes from './routes/contact.js';
import couponRoutes from './routes/coupon.js';
import Suggestion from './models/Suggestion.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';


// Swagger UI
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = JSON.parse(fs.readFileSync(path.resolve(__dirname, './swagger.json')));



const app = express();


// Trust proxy (needed for secure cookies behind reverse proxies)
app.set('trust proxy', 1);

// Basic security headers
app.use(helmet());

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsers (note: Stripe webhooks should use a separate raw parser file if needed)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookies
app.use(cookieParser());

// CORS – allow credentials for the client app
const origins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow non-browser requests or same-origin
    if (!origin) return callback(null, true);
    if (origins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));

// Публичен route за желания и препоръки (след CORS!)

// Static serving for uploads with CORS header for images
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsPath));

// Rate limiting (general)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Stricter rate limiting for auth & contact
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
});
app.use('/api/auth/', authLimiter);
app.use('/api/contact/', authLimiter);


// Swagger docs route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/coupon', couponRoutes);

// Публичен маршрут за желания/препоръки
app.post('/api/wish-suggestion', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 3) {
      return res.status(400).json({ msg: 'Въведете желание или препоръка!' });
    }
    const suggestion = new Suggestion({ text, user: req.user._id });
    await suggestion.save();
    res.status(201).json({ msg: 'Желанието е изпратено успешно!', suggestion });
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при записване на желание', error: e.message });
  }
});


// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment');
  process.exit(1);
}


import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';

const server = createServer(app);
const io = new SocketIO(server, {
  cors: {
    origin: origins,
    credentials: true
  }
});
app.set('io', io);

io.on('connection', (socket) => {
  // Очаква се клиентът да изпрати userId при свързване
  socket.on('registerUser', (userId) => {
    if (userId) socket.join(String(userId));
  });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    server.listen(PORT, () => console.log('Server + Socket.IO running on port', PORT));
  })
  .catch(err => {
    console.error('Mongo connection error:', err);
    process.exit(1);
  });


const t = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});
