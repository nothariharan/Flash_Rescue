const axios = require('axios'); // Assuming axios is installed, or valid if I run from client
// Actually better to use built-in fetch if node 18+ or stick to http.
// Let's use http to be safe without deps.

const http = require('http');

const data = JSON.stringify({
    name: 'Auto Test Donor',
    email: `autotest_${Date.now()}@test.com`,
    password: 'password123',
    role: 'donor'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        const json = JSON.parse(body);
        console.log('Response User Role:', json.user?.role);

        // Decode token payload (simple base64 decode of middle part)
        if (json.token) {
            const payload = json.token.split('.')[1];
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
            console.log('Token Payload Role:', decoded.role);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
