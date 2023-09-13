const { model, Schema } = require('mongoose');

module.exports = model('guild_rep_nick', new Schema({
    id: String,
    categories: {
        type: [{
            label: String,
            description: String,
            placeholder: String,
            emoji: String
        }],
        default: []
    },
    messages: {
        type: [{
            message: String,
            channel: String,
        }],
        default: []
    }
}));