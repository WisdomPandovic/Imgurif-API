const mongoose = require('mongoose')

 const CommentSchema = new mongoose.Schema({
	 comments: [
		{
            comment_user: { type: mongoose.Types.ObjectId, ref: "users" },
		     text: {type: String, required: true},
			 date: {type: Date, default: Date.now},
		 }
	 ],
	date:{type: Date, default:Date.now}
 })

 const Comment = mongoose.model("comments",CommentSchema)
 module.exports = Comment;
