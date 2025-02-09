const Post = require("../../models/post");
const Comment = require("../../models/comment");
const Notification = require("../../models/notification");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const multer = require("multer");
const path = require("path");
const PORT = 3007;
// const FILE_PATH = `http://localhost:${PORT}/postimage/`;
const FILE_PATH = `https://imgurif-api.onrender.com/postimage/`;
const User = require("../../models/user");
const Tag = require("../../models/tag");
const Like = require("../../models/like");
const express = require('express');
const router = express.Router();

const storage = multer.diskStorage({
	destination: (reg, file, cb) => {
		//let _dir = path.join(__dirname, "../../public/postimage");
		//cb(null, _dir);
		// cb(null, )
		cb(null, "public/postimage")

	},
	filename: (reg, file, cb) => {
		let filename = file.originalname.toLowerCase();
		cb(null, filename);
	},
});

const postimage = multer({ storage: storage });

// const routes = function (app) {
router.get('/post', async function (req, res) {
	try {
		let post = await Post.find().populate("tag").populate('user').lean();
		res.json(post)

	} catch (err) {
		res.status(500).send(err.msg)
	}
});

router.get('/post/:id', async function (req, res) {
	try {
		let { id } = req.params;
		let post = await Post.findById(id).populate('tag').populate('user')
			.populate({
				path: 'comments.comment_user',
				select: 'username',
			})
			.populate('comments.text')
			.lean();

		if (!post) {
			return res.status(404).json({ msg: 'Post not found' });
		};
		console.log('Post:', post);
		console.log(post.comments)
		res.json(post);
	} catch (err) {

		res.status(500).send(err.msg)
	}
});

router.put('/post/:id', async function (req, res) {
	try {
		let { id } = req.params
		let post = await Post.findById(id)
		let new_data = {}

		if (!post)
			return res.status(404).json({ msg: "post does not exist", code: 404 });

		new_data = { ...post._doc, ...req.body };

		post.overwrite(new_data);
		await post.save();

		res.json(post)
	} catch (err) {
		res.status(500).send(err.msg)
	}
});

router.delete('/post/:id', async function (req, res) {
	try {
		let { id } = req.params
		let post = await Post.findOneAndDelete({ _id: id });

		if (!post) return res.status(404).json({ msg: "post does not exit", code: 404 });
		res.json({ msg: "Post deleted" })

	} catch (err) {
		res.status(500).send(err.msg)
	}
});

// Like route
router.put('/like/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { user } = req.body; // The user who is liking the post

		const post = await Post.findById(id);
		const USER = await User.findById(user);

		if (!USER) {
			return res.status(404).json({ msg: "User does not exist", code: 404 });
		}
		if (!post) {
			return res.status(404).json({ msg: "Post does not exist", code: 404 });
		}

		// Check if the user has already liked the post
		const alreadyLiked = post.likes.includes(user);
		if (alreadyLiked) {
			return res.json({ msg: "Post already liked by this user" });
		}

		// Add the user to the likes array
		post.likes.push(user);

		// Save the post with the updated likes array
		await post.save();

		// Send a success response with the updated post and likes
		res.json({ msg: "Post has been liked", post });
	} catch (err) {
		console.log(err);
		res.status(500).send({ msg: "Internal server error" });
	}
});

// Unlike route
router.put('/unlike/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { user } = req.body; // The user who is unliking the post

		const post = await Post.findById(id);
		const USER = await User.findById(user);

		if (!USER) {
			return res.status(404).json({ msg: "User does not exist", code: 404 });
		}
		if (!post) {
			return res.status(404).json({ msg: "Post does not exist", code: 404 });
		}

		// Check if the user has already liked the post
		const alreadyLiked = post.likes.includes(user);
		if (!alreadyLiked) {
			return res.json({ msg: "User has not liked this post" });
		}

		// Remove the user from the likes array
		post.likes = post.likes.filter(like => like.toString() !== user);

		// Save the post after modifying its likes
		await post.save();

		// Send the updated likes with the success message
		res.json({ msg: "User has unliked this post", likes: post.likes });
	} catch (err) {
		console.log(err);
		res.status(500).send({ msg: "Internal server error" });
	}
});



router.post('/comment/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const post = await Post.findById(id).populate('user');

		// Extract the user ID from the object
		const userId = req.body.comment_user.id;

		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ msg: 'Invalid user ID' });
		}

		const newComment = {
			text: req.body.text,
			comment_user: userId, // Use the extracted user ID
		};

		console.log(newComment);
		console.log('comment_user.id:', userId);

		post.comments.unshift(newComment);

		await post.save();
		res.json(post);
		console.log(post);
	} catch (err) {
		console.log(err.msg);
		res.status(500).send({ msg: "internal server error" });
	}
});

router.get("/comments", async function (req, res) {
	try {
		const comments = await Post.find()
			.populate('user')
			.populate('comments.comment_user', 'username')
			.select('comments')
			.lean();

		const allComments = comments.flatMap(post => post.comments);

		res.json(allComments);
	} catch (err) {
		res.status(500).send(err.msg);
	}
});

router.get('/comment/:id', async (req, res) => {
	try {
		const { id } = req.params;
		let post = await Post.findById(id)
		res.json(post);
	} catch (error) {
		res.status(500).send(error.msg);
	}
})

router.post('/reply/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const post = await Post.findById(id).populate('user');

		// Extract the user ID from the object
		const userId = req.body.reply_user.id;

		// Validate the user ID
		if (!mongoose.Types.ObjectId.isValid(userId)) {
			return res.status(400).json({ msg: 'Invalid user ID' });
		}

		// Find the comment ID from the request body
		const { comment_id } = req.body;

		// Find the comment to which the reply will be added
		const comment = post.comments.find(comment => comment._id.toString() === comment_id);

		if (!comment) {
			return res.status(404).json({ msg: 'Comment not found' });
		}

		const newReply = {
			text: req.body.text,
			reply_user: userId, // Use the extracted user ID
		};

		// Add the new reply to the replies array of the comment
		comment.replies.unshift(newReply);

		await post.save();
		res.json(post);
	} catch (err) {
		console.log(err.msg);
		res.status(500).send({ msg: "Internal server error" });
	}
});

router.put('/replylikes/:id/:commentId', async (req, res) => {
	try {
		const { id, commentId } = req.params;
		console.log('Request received to like comment with ID:', commentId, 'in post with ID:', id);

		const post = await Post.findById(id);

		if (!post) {
			return res.status(404).json({ msg: "Post does not exist", code: 404 });
		}

		const comment = post.comments.id(commentId);

		if (!comment) {
			return res.status(404).json({ msg: "Comment does not exist", code: 404 });
		}

		const { user } = req.body;
		console.log('User ID from request body:', user);

		if (!user) {
			return res.status(400).json({ msg: "User ID is required in the request body", code: 400 });
		}

		const existingLike = comment.likes.find(like => like.equals(user));

		if (existingLike) {
			return res.json({ msg: "Comment already liked by this user" });
		}

		comment.likes.push(user);
		await post.save();
		res.json(comment.likes);
	} catch (err) {
		console.error(err.msg);
		res.status(500).send({ msg: "Internal server error" });
	}
});

router.put('/replyunlikes/:id/:commentId', async (req, res) => {
	try {
		const { id, commentId } = req.params;
		console.log('Request received to unlike comment with ID:', commentId, 'in post with ID:', id);

		const post = await Post.findById(id);

		if (!post) {
			return res.status(404).json({ msg: "Post does not exist", code: 404 });
		}

		const comment = post.comments.id(commentId);

		if (!comment) {
			return res.status(404).json({ msg: "Comment does not exist", code: 404 });
		}

		const { user } = req.body;
		console.log('User ID from request body:', user);

		if (!user) {
			return res.status(400).json({ msg: "User ID is required in the request body", code: 400 });
		}

		const existingLikeIndex = comment.likes.findIndex(like => like.equals(user));

		if (existingLikeIndex === -1) {
			return res.json({ msg: "Comment has not been liked by this user" });
		}

		comment.likes.splice(existingLikeIndex, 1);
		await post.save();
		res.json(comment.likes);
	} catch (err) {
		console.error(err.msg);
		res.status(500).send({ msg: "Internal server error" });
	}
});

router.get('/post/tag/:tagId', async (req, res) => {
	try {
		const tagId = req.params.tagId;
		const post = await Post.find({ tag: tagId });
		res.json(post);
	} catch (error) {
		res.status(500).json({ error: 'Internal server error' });
	}
});

router.get('/post/:id/views', async (req, res) => {
	try {
		const { id } = req.params;
		console.log('Received ID:', id);

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ err: 'Invalid post ID' });
		}

		const post = await Post.findById(id);
		if (!post) {
			return res.status(404).json({ err: 'Post not found' });
		}

		console.log('Retrieved post:', post);
		console.log('Current view count:', post.views);

		if (typeof post.views !== 'number') {
			console.error('Invalid view count data type');
			return res.status(500).json({ err: 'Invalid view count data type' });
		}

		console.log('View count before increment:', post.views);

		post.views += 1;
		await post.save();

		console.log('View count after increment:', post.views);

		res.json({ viewCount: post.views });
	} catch (err) {
		console.error('Error while fetching post views:', err);
		res.status(500).json({ err: 'Error while fetching post views' });
	}
});

router.post('/post/:id/increment-view', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        // Validate the userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ err: 'Invalid user ID format' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ err: 'User not found' });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ err: 'Post not found' });
        }

        // Increment the view count and save the post
        post.views += 1;
        await post.save();

        // Create a new notification
        const notification = new Notification({
            message: `${user.username} viewed your post "${post.title}".`,
            type: 'view',
        });
        await notification.save();

        res.json({ success: true, viewCount: post.views });
    } catch (err) {
        console.error('Error while incrementing post views:', err);
        res.status(500).json({ err: 'Error while incrementing post views' });
    }
});

router.get('/posts-with-users', async function (req, res) {
	try {
		let postsWithUsers = await Post.find()
			.populate('user')
			.populate('comments.comment_user')
			.lean();

		res.json(postsWithUsers);
	} catch (err) {
		res.status(500).send(err.msg);
	}
});

// router.post('/post', postimage.any(), async function(req, res) {
// 	try {
// 	  console.log('received request', req.body);
// 	  console.log('received files', req.files);

// 	  const { title, description, tag, user, imagepath } = req.body;

// 	  // Validate user ID
// 	  if (!ObjectId.isValid(user)) {
// 		console.error('Invalid user ID');
// 		return res.status(400).json({ msg: 'Invalid user ID' });
// 	  }

// 	  // Validate or find tag by name
// 	  let existingTag = await Tag.findOne({ name: tag });

// 	  if (!existingTag) {
// 		console.log('Tag not found, creating new tag...');

// 		// Create a new tag if it doesn't exist
// 		existingTag = new Tag({ name: tag });

// 		// Save the new tag to the database
// 		await existingTag.save();
// 	  }

// 	  let post = new Post({
// 		title,
// 		description,
// 		tag: existingTag._id,
// 		user,
// 		image: imagepath,
// 		views: 0
// 	  });

// 	  console.log('post created:', post);
// 	  await post.save();

// 	  // Update the tag with the new post ID
// 	  await Tag.findByIdAndUpdate(existingTag._id, { $push: { post: post._id } });

// 	  res.json({ msg: "post created", code: 200 });
// 	} catch (err) {
// 	  console.error('Error creating post:', err);
// 	  res.status(500).send(err.msg);
// 	}
//   });	  

router.post('/post', postimage.any(), async function (req, res) {
	try {
		console.log('Received request', req.body);
		console.log('Received files', req.files);

		const { title, description, tag, user, imagepath, mature } = req.body;

		// Validate user ID
		if (!ObjectId.isValid(user)) {
			console.error('Invalid user ID');
			return res.status(400).json({ msg: 'Invalid user ID' });
		}

		// Validate or find tag by name
		let existingTag = await Tag.findOne({ name: tag });

		if (!existingTag) {
			console.log('Tag not found, creating new tag...');
			// Create a new tag if it doesn't exist
			existingTag = new Tag({ name: tag });
			await existingTag.save();
		}

		// Create a new post
		let post = new Post({
			title,
			description,
			tag: existingTag._id,
			user,
			image: imagepath,
			views: 0,
			mature: mature === 'true' // Convert string to boolean (assuming request sends it as a string)
		});

		console.log('Post to be saved:', post);

		// Save the post
		const savedPost = await post.save();
		console.log('Post created:', savedPost);

		// Update the user with the new post
		await User.findByIdAndUpdate(user, { $push: { posts: savedPost._id } });

		// Update the tag with the new post ID
		await Tag.findByIdAndUpdate(existingTag._id, { $push: { post: savedPost._id } });

		res.json({ msg: "Post created", code: 200 });
	} catch (err) {
		console.error('Error creating post:', err);
		res.status(500).send(err.msg);
	}
});

// Get posts by username
router.get('/user/:username/posts', async (req, res) => {
	try {
		const { username } = req.params;

		// Find the user by username
		const user = await User.findOne({ username });

		if (!user) {
			return res.status(404).json({ msg: "User not found" });
		}

		// Find posts associated with the user
		const posts = await Post.find({ user: user._id })
			.populate('tag')
			.populate('user', 'username')
			.lean();

		res.json(posts);
	} catch (err) {
		console.error(err);
		res.status(500).json({ msg: "Internal server error" });
	}
});

// Route to get all comments for a specific user
router.get('/user/:userId/comments-made', async (req, res) => {
	const userId = req.params.userId;
	try {
		// Find posts where the user has commented
		const posts = await Post.find({
			'comments.comment_user': userId
		})
			.populate('comments.comment_user', 'username') // Populating the comment_user with username
			.exec();

		// Extracting all comments made by the user from posts
		const userComments = [];
		posts.forEach(post => {
			post.comments.forEach(comment => {
				if (comment.comment_user._id.toString() === userId) {
					userComments.push(comment);
				}
			});
		});

		res.json(userComments);
	} catch (error) {
		res.status(500).json({ message: 'Error fetching comments', error });
	}
});

// Backend route to get all comments for a user across all their posts
router.get('/user/:userId/comments-on-posts', async (req, res) => {
	const { userId } = req.params;

	try {
		// Fetch all posts by the user
		const posts = await Post.find({ user: userId }).populate('comments.comment_user', 'username');

		if (!posts || posts.length === 0) {
			return res.status(404).json({ message: 'No posts found for this user' });
		}

		// Collect all comments from the user's posts
		const allComments = posts.reduce((comments, post) => {
			return comments.concat(post.comments);
		}, []);

		// Return all comments
		res.status(200).json(allComments);
	} catch (error) {
		console.error('Error fetching comments:', error);
		res.status(500).json({ message: 'Error fetching comments' });
	}
});

router.get('/posts/popular', async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ likes: -1 }).limit(10);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts', error: err });
  }
});

module.exports = router;
