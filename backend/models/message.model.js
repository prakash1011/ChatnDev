import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'project',
        required: true,
        index: true // Add index for faster queries
    },
    sender: {
        _id: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        }
    },
    message: {
        type: mongoose.Schema.Types.Mixed, // Can store strings or JSON objects
        required: true
    },
    isAiMessage: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Add compound index for efficient querying
messageSchema.index({ projectId: 1, createdAt: -1 });

const Message = mongoose.model('message', messageSchema);

export default Message;
