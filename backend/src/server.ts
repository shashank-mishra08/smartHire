import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import chatRoutes from './routes/chatRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import uploadRoutes from './routes/uploadRoutes';

const app = express();

// Ensure DB is connected before handling requests
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    await connectDatabase();
    dbConnected = true;
  }
  next();
});

// Middleware
const allowedOrigins = [config.frontendUrl, 'https://smarthire-d9513.web.app'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/chat', chatRoutes);        // Public — candidates don't login
app.use('/api/dashboard', dashboardRoutes); // 🔒 Protected — requires JWT
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SmartHire API',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start server
async function start() {
  // Connect to Firebase Firestore
  await connectDatabase();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║   🚀 SmartHire API Server                ║
║                                          ║
║   Port:     ${config.port}                        ║
║   Mode:     ${config.nodeEnv.padEnd(22)}║
║   Frontend: ${config.frontendUrl.padEnd(22)}║
║                                          ║
╚══════════════════════════════════════════╝
    `);
  });
}

// Start local server if not running in Firebase Functions (v2 sets K_SERVICE, v1 sets FUNCTION_TARGET)
if (!process.env.FUNCTION_TARGET && !process.env.K_SERVICE) {
  start();
}

// Export the Express API as a Firebase Cloud Function
export const api = onRequest({ region: 'us-central1', invoker: 'public' }, app);
