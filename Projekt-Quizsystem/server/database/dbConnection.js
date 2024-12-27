const dotenv = require('dotenv');
dotenv.config();
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function connectToDatabase() {
    try {
        const pool = await sql.connect(config);
        console.log('Connected to the database!');
        return pool;
    } catch (err) {
        console.error('Database connection failed!', err);
        throw err;
    }
}

module.exports = connectToDatabase;
