const { model, Schema } = require('mongoose');

const userSchema = new Schema({
    id: String,
    reputation: {
        type: Number,
        default: 0
    },
    staffReputation: {
        type: Number,
        default: 0
    },
    timeouts: {
        type: Object,
        default: {}
    },
    banned: Boolean
});

const userModel = model('user_rep_nick', userSchema);

module.exports = userModel;