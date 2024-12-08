const sql = require('mssql');
const connectToDatabase = require('./dbConnection');

async function testDatabase() {
    let pool;
    try {
        pool = await connectToDatabase();
        
        const createTableQuery = `
            CREATE TABLE questions (
                id INT PRIMARY KEY IDENTITY,
                question_text NVARCHAR(255) NOT NULL,
                answer_option1 NVARCHAR(255),
                answer_option2 NVARCHAR(255),
                answer_option3 NVARCHAR(255),
                correct_option INT
            );
        `;
        await pool.request().query(createTableQuery);
        console.log('Table created successfully!');

        const insertQuery = `
            INSERT INTO questions (question_text, answer_option1, answer_option2, answer_option3, correct_option)
            VALUES (@question_text, @option1, @option2, @option3, @correctOption);
        `;
        await pool.request()
            .input('question_text', sql.NVarChar, 'What is the capital of Germany?')
            .input('option1', sql.NVarChar, 'Berlin')
            .input('option2', sql.NVarChar, 'Hamburg')
            .input('option3', sql.NVarChar, 'Munich')
            .input('correctOption', sql.Int, 1)
            .query(insertQuery);
        console.log('Data inserted successfully!');

        const result = await pool.request().query('SELECT * FROM questions;');
        console.log('Data from database:', result.recordset);
    } catch (err) {
        console.error('Error during database operations:', err);
    } finally {
        if (pool) await pool.close();
    }
}

testDatabase();