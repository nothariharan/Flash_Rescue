const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Vite default port
        methods: ["GET", "POST"]
    }
});
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for Base64 images for MVP

const listingRoutes = require('./routes/listingRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/listings', listingRoutes);
app.use('/api/auth', authRoutes);

// Database Connection
const connectDB = require('./config/db');
connectDB();

// (Optional) Warn if still relying on files for some features during migration
// console.log('Using File-Based Database for MVP');


// Socket.io Connection
const startPriceDecayEngine = require('./services/priceEngine');
const Message = require('./models/Message'); // Import Message model

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join user room for notifications
    socket.on('user_connected', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} (Socket: ${socket.id}) connected to personal room.`);
    });

    // Join a specific chat room (listingId)
    socket.on('join_chat', (listingId) => {
        socket.join(listingId);
        console.log(`User ${socket.id} joined chat: ${listingId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
        const { listingId, senderId, text } = data;

        try {
            // Save to DB
            const newMessage = await Message.create({
                listingId,
                sender: senderId,
                text
            });

            // Populate sender info for the frontend
            await newMessage.populate('sender', 'name role');

            // Broadcast to room (active chatters)
            io.to(listingId).emit('receive_message', newMessage);

            // Fetch listing to find the owner (donor)
            const Listing = require('./models/Listing');
            const listing = await Listing.findById(listingId);

            if (listing) {
                const ownerId = listing.donor; // donor field contains User ID string

                // Notify the owner if they are NOT the sender
                if (ownerId && ownerId !== senderId) {
                    console.log(`Notifying owner ${ownerId} of new message from ${senderId}`);
                    io.to(ownerId).emit('receive_message', newMessage); // Also send to owner's personal room

                    // Also emit a specific notification event
                    io.to(ownerId).emit('new_message_notification', {
                        title: `New message from ${newMessage.sender.name}`,
                        message: text,
                        listingId: listingId,
                        senderName: newMessage.sender.name
                    });
                }

                // Also notify the sender if they are not in the room (unlikely but good for multi-device)
                // io.to(senderId).emit('receive_message', newMessage);
            }

        } catch (err) {
            console.error('Error sending message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Register Chat Routes
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Start Price Decay Engine
startPriceDecayEngine(io);

// Basic Route
app.get('/', (req, res) => {
    res.send('Flash-Rescue API is running');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
