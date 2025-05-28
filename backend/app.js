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
app.use(cors({
    origin: ["https://chatndev-frontend.windsurf.build", "http://localhost:5173"],
    credentials: true
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

// Default route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

export default app;
