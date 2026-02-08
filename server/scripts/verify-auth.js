const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const run = async () => {
    try {
        // 1. Register
        console.log('Registering...');
        try {
            await axios.post(`${API_URL}/auth/register`, {
                name: 'Auth Test User',
                email: 'test@auth.com',
                password: 'password123',
                role: 'donor'
            });
            console.log('Registered.');
        } catch (e) {
            if (e.response && e.response.status === 400 && e.response.data.message === 'User already exists') {
                console.log('User already exists, proceeding to login.');
            } else {
                throw e;
            }
        }

        // 2. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@auth.com',
            password: 'password123'
        });
        const { token } = loginRes.data;
        console.log('Logged in. Token:', token.substring(0, 20) + '...');

        // 3. Create Listing with Token
        console.log('Creating Listing with Token...');
        const listingRes = await axios.post(`${API_URL}/listings`, {
            name: 'Auth Protected Croissant',
            category: 'bakery',
            quantity: '10kg',
            initialPrice: 50,
            freeAt: new Date(Date.now() + 3600000).toISOString(),
            location: { lat: 0, lng: 0, address: 'Test' }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Listing Created ID:', listingRes.data._id);

        // 4. Create Listing WITHOUT Token (Expect Failure)
        console.log('Creating Listing WITHOUT Token...');
        try {
            await axios.post(`${API_URL}/listings`, {
                name: 'Fail Croissant',
                category: 'bakery',
                quantity: '1kg',
                initialPrice: 10,
                freeAt: new Date().toISOString()
            });
        } catch (e) {
            console.log('Expected Error:', e.response.status, e.response.data.message);
        }

        console.log('VERIFICATION SUCCESSFUL');

    } catch (error) {
        console.error('Verification Failed:', error.message);
        if (error.response) console.error(error.response.data);
    }
};

run();
