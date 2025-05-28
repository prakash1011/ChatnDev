import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    message: {
        type: String,
        required: true
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const messageModel = mongoose.model('Message', messageSchema);

export default messageModel;
