import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';
import { saveMessage } from './services/message.service.js';

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }

        socket.project = await projectModel.findById(projectId);

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'));
        }

        socket.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
});

// Socket.io connection handler
io.on('connection', socket => {
    try {
        console.log('User connected to socket:', socket.user?.email);
        
        // Make sure project exists and has a valid ID
        if (!socket.project || !socket.project._id) {
            console.error('Invalid project in socket connection');
            socket.disconnect();
            return;
        }
        
        socket.roomId = socket.project._id.toString();
        socket.join(socket.roomId);

        socket.on('project-message', async data => {
            try {
                if (!data || !data.message) {
                    console.error('Invalid message data');
                    return;
                }
                
                const message = data.message;
                const aiIsPresentInMessage = message.includes('@ai');
                
                // Save message to database with consistent format
                try {
                    await saveMessage({
                        projectId: socket.project._id,
                        message: message,
                        sender: data.sender
                    });
                    console.log('User message saved to database');
                } catch (saveError) {
                    console.error('Error saving message to database:', saveError);
                }

                // Broadcast message to room
                socket.broadcast.to(socket.roomId).emit('project-message', data);

                // Handle AI responses
                if (aiIsPresentInMessage) {
                    try {
                        const prompt = message.replace('@ai', '');
                        const result = await generateResult(prompt);

                        const aiMessageData = {
                            message: result,
                            sender: {
                                _id: 'ai',
                                email: 'AI'
                            }
                        };
                        
                        // Save AI response to database with proper formatting
                        try {
                            // For AI messages, ensure the format is a JSON string with a text property
                            // This matches what the frontend expects
                            const formattedResult = typeof result === 'string' && !result.startsWith('{') 
                                ? JSON.stringify({ text: result }) 
                                : result;
                                
                            await saveMessage({
                                projectId: socket.project._id,
                                message: formattedResult,
                                sender: aiMessageData.sender
                            });
                            console.log('AI message saved to database');
                        } catch (saveError) {
                            console.error('Error saving AI message to database:', saveError);
                        }
                        
                        // Send AI response to room
                        io.to(socket.roomId).emit('project-message', aiMessageData);
                    } catch (aiError) {
                        console.error('Error generating AI response:', aiError);
                        // Send error message to room
                        io.to(socket.roomId).emit('project-message', {
                            message: 'Sorry, I encountered an error processing your request.',
                            sender: {
                                _id: 'ai',
                                email: 'AI'
                            }
                        });
                    }
                }
            } catch (messageError) {
                console.error('Error handling project message:', messageError);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.user?.email);
            socket.leave(socket.roomId);
        });
        
    } catch (connectionError) {
        console.error('Error in socket connection handler:', connectionError);
        socket.disconnect();
    }
});

// Start server
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});