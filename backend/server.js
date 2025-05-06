import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',              // Local development
            'https://soen-frontend.onrender.com',   // Render deployment
            'https://chatndev.onrender.com'        // New frontend
        ],
        credentials: true
    }
});


io.use(async (socket, next) => {

    try {

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }


        socket.project = await projectModel.findById(projectId);


        if (!token) {
            return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'))
        }


        socket.user = decoded;

        next();

    } catch (error) {
        next(error)
    }

})


io.on('connection', socket => {
    socket.roomId = socket.project._id.toString()


    console.log('a user connected');



    socket.join(socket.roomId);

    socket.on('project-message', async data => {
        try {
            const message = data.message;

            // Forward the message to all users in the room except the sender
            socket.broadcast.to(socket.roomId).emit('project-message', data);

            // Check if this is a message directed to the AI
            const aiIsPresentInMessage = message && typeof message === 'string' && message.includes('@ai');

            if (aiIsPresentInMessage) {
                console.log('AI message detected, processing prompt...');

                // Acknowledge the AI request is being processed
                io.to(socket.roomId).emit('ai-processing', { processing: true });

                // Extract the prompt by removing the @ai mention
                const prompt = message.replace('@ai', '').trim();

                if (prompt.length === 0) {
                    // If prompt is empty, send a help message
                    io.to(socket.roomId).emit('project-message', {
                        message: "Hi there! I'm the AI assistant. How can I help you with your project today?",
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        }
                    });
                } else {
                    // Generate AI response
                    const result = await generateResult(prompt);

                    // Send the AI response back to all users in the room
                    io.to(socket.roomId).emit('project-message', {
                        message: result,
                        sender: {
                            _id: 'ai',
                            email: 'AI'
                        }
                    });
                }

                // Signal that AI processing is complete
                io.to(socket.roomId).emit('ai-processing', { processing: false });
            }
        } catch (error) {
            console.error('Error processing message:', error);

            // Send error message if something went wrong
            io.to(socket.roomId).emit('project-message', {
                message: "Sorry, I couldn't process your request at this time. Please try again later.",
                sender: {
                    _id: 'ai',
                    email: 'AI'
                }
            });

            // Signal that AI processing is complete
            io.to(socket.roomId).emit('ai-processing', { processing: false });
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});




server.listen(port, () => {
    console.log(`Server is running on port ${ port }`);
})