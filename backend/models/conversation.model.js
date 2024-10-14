import mongoose from 'mongoose'

const conversationModel = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    message:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }]
});

export default Conversation = mongoose.model('Conversation', conversationSchema);

