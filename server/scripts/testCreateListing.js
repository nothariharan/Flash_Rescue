const axios = require('axios');
const jwt = require('jsonwebtoken');

// Mock a token for a donor
const token = jwt.sign({ id: '507f1f77bcf86cd799439011', role: 'donor' }, 'secret_key_MVP', { expiresIn: '1h' });

const createListing = async () => {
    try {
        const payload = {
            name: 'Test Listing from Script',
            category: 'produce',
            quantity: '5 kg',
            initialPrice: 100,
            expiryWindow: 4,
            location: {
                lat: 12.9716,
                lng: 77.5946,
                address: 'Test Address'
            },
            freeAt: new Date().toISOString(),
            // Small base64 image for testing
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='
        };

        console.log('Sending request...');
        const res = await axios.post('http://localhost:5000/api/listings', payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Success:', res.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
    }
};

createListing();
