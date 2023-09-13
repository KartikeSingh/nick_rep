const { model, Schema } = require('mongoose');

module.exports = model('user_data_nick', new Schema({
    id: String,
    uuid: String,
    name: String,
    ip: String,
    code: String,
    epoch: Number,
    lastUpdated: Number,
    apiData: {
        type: Object,
        default: {}
    },
    cached:Boolean
}));