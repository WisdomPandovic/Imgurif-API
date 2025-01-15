const express = require('express');
const mongoose = require('mongoose');
const Notification = require('../../models/notification');
const Post = require("../../models/post");
const router = express.Router();

// Route: GET /notifications - Retrieves a list of notifications
router.get('/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default pagination params
    const notifications = await Notification.find()
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalNotifications = await Notification.countDocuments();
    
    res.json({
      success: true,
      data: notifications,
      total: totalNotifications,
      currentPage: Number(page),
      totalPages: Math.ceil(totalNotifications / limit),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
