const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');

// Get messages for a specific listing (Chat Room)
router.get('/:listingId', protect, async (req, res) => {
    try {
        const messages = await Message.find({ listingId: req.params.listingId })
            .populate('sender', 'name role') // Populate sender details
            .sort({ createdAt: 1 }); // Oldest first
        res.json(messages);
    } catch (error) {
        console.error('Get Messages Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Post a new message (Fallback for HTTP, though Socket is primary)
router.post('/', protect, async (req, res) => {
    try {
        const { listingId, text } = req.body;

        const message = await Message.create({
            listingId,
            sender: req.user.id,
            text
        });

        const populatedMessage = await message.populate('sender', 'name role');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Post Message Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
