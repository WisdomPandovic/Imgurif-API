const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: true, unique: false },
    description: { type: String, required: false },
    tag: { type: mongoose.Schema.Types.ObjectId, ref: 'tags',},
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    views: { type: Number, default: 0 },
    comments: [{
        text: { type: String, required: true },
        date: { type: Date, default: Date.now },
        comment_user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
        replies: [{
            text: { type: String, required: true },
            date: { type: Date, default: Date.now },
            reply_user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
        }],
    }],
    mature: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
});

const Post = mongoose.model('posts', PostSchema);

module.exports = Post;
