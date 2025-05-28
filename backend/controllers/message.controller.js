import * as messageService from '../services/message.service.js';

/**
 * Get all messages for a specific project
 */
export const getProjectMessagesController = async (req, res) => {
    try {
        const { projectId } = req.params;
        console.log('Fetching messages for project:', projectId);
        
        const messages = await messageService.getProjectMessages(projectId);
        console.log('Found messages count:', messages.length);
        
        if (messages.length > 0) {
            console.log('Sample message:', JSON.stringify(messages[0]));
        }
        
        return res.status(200).json({ messages });
    } catch (error) {
        console.error('Error in getProjectMessagesController:', error);
        return res.status(400).json({ error: error.message });
    }
};

/**
 * Clear all messages for a specific project
 */
export const clearProjectMessagesController = async (req, res) => {
    try {
        const { projectId } = req.params;
        await messageService.deleteProjectMessages(projectId);
        return res.status(200).json({ message: 'All messages cleared successfully' });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
