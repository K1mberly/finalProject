const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('mongoose-currency').loadType(mongoose);

const commentSchema = new Schema({
    comment: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const tutorialSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    img:{
        type: String,
        default: ''
    },
    comments: [commentSchema]
}, {
    timestamps: true
});

var Tutorials = mongoose.model('Tutorial', tutorialSchema);

module.exports = Tutorials;