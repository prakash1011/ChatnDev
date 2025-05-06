import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';

const router = Router();

// Create project route
router.post('/create',
    authMiddleWare.authUser,
    body('name').isString().withMessage('Name is required'),
    projectController.createProject
);

// Get all projects route
router.get('/all',
    authMiddleWare.authUser,
    projectController.getAllProject
);

// Add user to project route
router.put('/add-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),
    projectController.addUserToProject
);

// Get specific project by ID route
router.get('/get-project/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectById
);

// Update file tree route
router.put('/update-file-tree',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    projectController.updateFileTree
);

// DELETE PROJECT ROUTES - offering multiple route patterns for reliability
// Standard REST pattern: DELETE /projects/:id
router.delete('/:projectId',
    authMiddleWare.authUser,
    projectController.deleteProject
);

// More explicit route pattern: DELETE /projects/delete/:id
router.delete('/delete/:projectId',
    authMiddleWare.authUser,
    projectController.deleteProject
);

// Completely new route specifically for deletion using POST instead of DELETE (for compatibility)
router.post('/remove-project/:projectId',
    authMiddleWare.authUser,
    projectController.deleteProject
);

// PROJECT MESSAGES ROUTES
// Save a message for a specific project
router.post('/:projectId/messages', authMiddleWare.authUser, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { message, sender, isAiMessage } = req.body;

        // Validate required fields
        if (!message || !sender) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: message and sender are required'
            });
        }

        // Import the Message model here to avoid circular dependencies
        const Message = (await import('../models/message.model.js')).default;

        // Create and save the new message
        const newMessage = new Message({
            projectId,
            message,
            sender,
            isAiMessage: isAiMessage || false
        });

        await newMessage.save();

        return res.status(201).json({
            success: true,
            message: 'Message saved successfully',
            data: newMessage
        });
    } catch (error) {
        console.error('Error saving message:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save message',
            error: error.message
        });
    }
});

// Get messages for a specific project
router.get('/:projectId/messages', authMiddleWare.authUser, async (req, res) => {
    try {
        const { projectId } = req.params;
        const limit = parseInt(req.query.limit) || 20; // Default to 20 messages
        const page = parseInt(req.query.page) || 0;

        // Import the Message model here to avoid circular dependencies
        const Message = (await import('../models/message.model.js')).default;

        // Get total count for pagination info
        const totalMessages = await Message.countDocuments({ projectId });

        // Get messages with pagination, sorted by creation time (newest last)
        const messages = await Message.find({ projectId })
            .sort({ createdAt: 1 })
            .skip(page * limit)
            .limit(limit);

        return res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                total: totalMessages,
                page,
                limit,
                pages: Math.ceil(totalMessages / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
});

export default router;