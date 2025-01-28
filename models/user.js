const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,required: true, unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, // Convert email to lowercase for case-insensitive matching
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  about: {
    type: String,
    default: '',
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  medallions: {
    silver: {
      type: Number,
      default: 0,
    },
    gold: {
      type: Number,
      default: 0,
    },
    platinum: {
      type: Number,
      default: 0,
    },
  },
  following: {
    type: Number,
    default: 0,
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',  // Reference to User model
    default: []
  }],  
  notoriety: {
    type: String,
    enum: ['Newbie', 'Explorer', 'Veteran', 'Elite', 'Legend'],
    default: 'Newbie', 
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'posts',
  }],
});

// Hash password before saving (using bcrypt with a reasonable salt rounds)
UserSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10); // Adjust salt rounds as needed
  this.password = await bcrypt.hash(this.password, salt);
  console.log('Hashed password:', this.password); 
  next();
});

const User = mongoose.model("users",UserSchema)
 module.exports = User;
