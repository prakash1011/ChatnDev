import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import messageRoutes from './routes/message.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Connect to database
connect();

const app = express();

// Middleware
// Set cross-origin isolation headers FIRST to ensure they aren't overridden
app.use((req, res, next) => {
  // These headers are required for SharedArrayBuffer
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Additional security headers that might help
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

app.use(cors({
  origin: [
    'http://localhost:5173',              // Local development
    'https://soen-frontend.onrender.com',   // Render deployment
    'https://chatndev.onrender.com'        // New frontend
  ],
  credentials: true,
  // Ensure CORS doesn't override our security headers
  exposedHeaders: ['Cross-Origin-Embedder-Policy', 'Cross-Origin-Opener-Policy']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);
app.use('/messages', messageRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;