import express from 'express';
import Message from '../models/message.model.js';
import { authUser } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Save a new message to the database
 * @route POST /save
 */
router.post('/save', authUser, async (req, res) => {
    try {
        const { projectId, message, sender, isAiMessage } = req.body;

        // Validate required fields
        if (!projectId || !message || !sender) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: projectId, message, and sender are required'
            });
        }

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

/**
 * Get messages for a project with pagination
 * @route GET /project/:projectId
 */
router.get('/project/:projectId', authUser, async (req, res) => {
    try {
        const { projectId } = req.params;
        const limit = parseInt(req.query.limit) || 20; // Default to 20 messages
        const page = parseInt(req.query.page) || 0;

        // Validate project ID
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

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

/**
 * Get recent messages for a project (most recent N messages)
 * @route GET /project/:projectId/recent
 */
router.get('/project/:projectId/recent', authUser, async (req, res) => {
    try {
        const { projectId } = req.params;
        const limit = parseInt(req.query.limit) || 20; // Default to 20 recent messages

        // Validate project ID
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        // Efficient approach to get recent messages in chronological order
        const messages = await Message.find({ projectId })
            .sort({ createdAt: -1 }) // Descending order to get newest first
            .limit(limit)
            .then(msgs => msgs.reverse()); // Reverse to get chronological order

        return res.status(200).json({
            success: true,
            data: messages,
            count: messages.length
        });
    } catch (error) {
        console.error('Error fetching recent messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch recent messages',
            error: error.message
        });
    }
});

export default router;
