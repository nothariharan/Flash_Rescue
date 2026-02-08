const fs = require('fs').promises;
const path = require('path');

const getDataFile = (filename) => path.join(__dirname, `../data/${filename}`);

const readData = async (filename = 'listings.json') => {
    try {
        const data = await fs.readFile(getDataFile(filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};

const writeData = async (filename, data) => {
    // Check if only one argument provided (data is undefined)
    if (data === undefined) {
        data = filename;
        filename = 'listings.json';
    }

    await fs.writeFile(getDataFile(filename), JSON.stringify(data, null, 2));
};

module.exports = { readData, writeData };
