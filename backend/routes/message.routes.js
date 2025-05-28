import express from 'express';
import * as messageController from '../controllers/message.controller.js';
import { authUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route to get all messages for a specific project
router.get('/:projectId', authUser, messageController.getProjectMessagesController);

// Route to clear all messages for a specific project
router.delete('/:projectId', authUser, messageController.clearProjectMessagesController);

export default router;
