const { model, Schema } = require('mongoose');

module.exports = model('reputation_nick', new Schema({
    id: String,
    staff: Boolean,
    target: String,
    sender: String,
    invalidatedBy: String,
    revalidatedBy: String,
    category: String,
    reason: {
        give: String,
        remove: String,
    },
    messages: {
        public: String,
        admin: String
    },
    isValid: Boolean,
    updatedAt: Number,
    createdAt: Number,
}))