const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const usersPath = path.join(__dirname, 'data/users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

const email = 'org@test.com';
const password = 'password';

const user = users.find(u => u.email === email);

if (!user) {
    console.log('User not found!');
} else {
    console.log('User found:', user.email);
    console.log('Stored Hash:', user.password);

    bcrypt.compare(password, user.password).then(isMatch => {
        console.log('Password "password" is match?', isMatch);
    }).catch(err => {
        console.error('Bcrypt Error:', err);
    });
}
