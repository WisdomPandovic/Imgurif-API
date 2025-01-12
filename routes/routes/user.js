const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const Post = require("../../models/post");
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ msg: "This is my user index route" });
});

router.get('/users', async (req, res) => {
    try {
        let users = await User.find().lean();
        res.json(users);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        let { id } = req.params;
        let user = await User.findById(id);

        if (!user) return res.status(404).json({ msg: "User does not exist", code: 404 });

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post("/users", async (req, res) => {
    try {
        const { username, email, phoneNumber, password, role } = req.body;

        const user = new User({
            username,
            email: email.toLowerCase(),
            phoneNumber,
            password, 
            role,
        });

        await user.save();

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        let { id } = req.params;
        let user = await User.findById(id);
        let new_data = {};

        if (!user) return res.status(404).json({ msg: "User does not exist", code: 404 });

        new_data = { ...user._doc, ...req.body };

        user.overwrite(new_data);
        await user.save();

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.delete('/user/:id', async (req, res) => {
    try {
        let { id } = req.params;
        let user = await User.findOneAndDelete({ _id: id }); 

        if (!user) {
            return res.status(404).json({ msg: "User does not exist", code: 404 });
        }

        res.json({ msg: "User deleted" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/users-with-posts', async (req, res) => {
    try {
        let usersWithPosts = await User.find().populate('post').lean();
        res.json(usersWithPosts);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Received login request with username:", username, "and password:", password);

        // Find the user by username
        const user = await User.findOne({ username });
        console.log("Retrieved user from database:", user);

        if (!user) {
            console.log("User not found in the database");
            return res.status(404).json({ msg: 'Invalid username or password' });
        }

        console.log("Retrieved hashed password from the database:", user.password);

        // Compare the plain text password from the request with the hashed password stored in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("Password comparison result:", isPasswordValid);

        if (isPasswordValid) {
            // Passwords match, handle successful login
            // Optionally, you can include user details in the response
            res.json({ success: true, msg: 'Login successful', user });
        } else {
            // Passwords don't match, handle unsuccessful login
            console.log("Password is invalid");
            res.status(401).json({ msg: 'Invalid username or password' });
        }
    } catch (error) {
        console.error("Error occurred during login:", error);
        res.status(500).json({ msg: 'Internal server error occurred' });
    }
});

// Route to get a user by username
router.get('/user-by-username/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ msg: "User not found", code: 404 });
        }

        res.json(user);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
