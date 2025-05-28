import messageModel from '../models/message.model.js';

/**
 * Save a new message to the database
 * @param {Object} messageData - Message data including projectId, message content, and sender info
 * @returns {Promise<Object>} - The saved message
 */
export const saveMessage = async (messageData) => {
    try {
        const message = new messageModel(messageData);
        return await message.save();
    } catch (error) {
        console.error('Error saving message:', error);
        throw new Error('Failed to save message');
    }
};

/**
 * Get all messages for a specific project
 * @param {String} projectId - The ID of the project
 * @returns {Promise<Array>} - Array of messages
 */
export const getProjectMessages = async (projectId) => {
    try {
        return await messageModel.find({ projectId }).sort({ createdAt: 1 });
    } catch (error) {
        console.error('Error retrieving project messages:', error);
        throw new Error('Failed to retrieve project messages');
    }
};

/**
 * Delete all messages for a specific project
 * @param {String} projectId - The ID of the project
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteProjectMessages = async (projectId) => {
    try {
        return await messageModel.deleteMany({ projectId });
    } catch (error) {
        console.error('Error deleting project messages:', error);
        throw new Error('Failed to delete project messages');
    }
};
