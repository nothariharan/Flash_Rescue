const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Still needed if we manually compare, though model has matchPassword
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_MVP';

// Register User
exports.register = async (req, res) => {
    try {
        const { email, password, role, name } = req.body;
        console.log('Register Request Body:', req.body); // DEBUG LOG

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user (password hashing handled by pre-save hook in model)
        const user = await User.create({
            _id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(), // Generate String ID
            name,
            email,
            password,
            role: role || 'consumer'
        });

        // Create Token
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        // We need to explicitly select password because it makes it simpler to compare
        // But our model set select: false. So we use .select('+password')
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                location: user.location
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Current User (Me)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        console.error('Get Me Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
