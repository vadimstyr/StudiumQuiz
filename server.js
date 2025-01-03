const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const sql = require('mssql');
const { verifyLogin } = require('./server/handlers/loginHandler');
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

// Azure Key Vault Setup
const credential = new DefaultAzureCredential();
const vaultName = process.env.KEY_VAULT_NAME;
const url = `https://${vaultName}.vault.azure.net`;
const client = new SecretClient(url, credential);

// Konfiguration async laden
async function getDbConfig() {
    const config = {
        user: (await client.getSecret('DB-USER')).value,
        password: (await client.getSecret('DB-PASSWORD')).value,
        server: (await client.getSecret('DB-SERVER')).value,
        database: (await client.getSecret('DB-NAME')).value,
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };
    return config;
}

const app = express();
const port = process.env.PORT || 3000;

// CORS-Konfiguration
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://iu-quiz-studio.azurewebsites.net'
    ],
    credentials: true
}));

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'IhrGeheimesPasswort123',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Andere Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await verifyLogin(email, password);
        
        if (result.success) {
            req.session.userId = result.user.id;
            req.session.email = email;
            req.session.isLoggedIn = true;
            
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        console.error('Session-Speicher-Fehler:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Login-Route-Fehler:', error);
        res.status(500).json({ success: false, message: 'Server-Fehler' });
    }
});

// Route zum Prüfen des Login-Status
app.get('/api/check-auth', (req, res) => {
    if (req.session && req.session.isLoggedIn) {
        res.json({ 
            isLoggedIn: true, 
            email: req.session.email 
        });
    } else {
        res.json({ 
            isLoggedIn: false 
        });
    }
});

// Aktuelle Session-User abrufen
app.get('/api/current-user', (req, res) => {
    if (req.session && req.session.email) {
        res.json({ email: req.session.email });
    } else {
        res.status(401).json({ message: 'Nicht eingeloggt' });
    }
});

// Neue Frage speichern
app.post('/api/questions', async (req, res) => {
    try {
        if (!req.session.isLoggedIn) {
            return res.status(401).json({ success: false, message: 'Nicht eingeloggt' });
        }

        const config = await getDbConfig();
        const pool = await sql.connect(config);
        
        const result = await pool.request()
            .input('question', sql.NVarChar, req.body.question)
            .input('answerA', sql.NVarChar, req.body.answers.A)
            .input('answerB', sql.NVarChar, req.body.answers.B)
            .input('answerC', sql.NVarChar, req.body.answers.C)
            .input('answerD', sql.NVarChar, req.body.answers.D)
            .input('correctAnswer', sql.VarChar, req.body.correctAnswer)
            .input('creatorEmail', sql.VarChar, req.session.email)
            .query(`
                INSERT INTO QuizQuestions (
                    question, 
                    answerA, 
                    answerB, 
                    answerC, 
                    answerD, 
                    correctAnswer, 
                    creatorEmail
                ) VALUES (
                    @question,
                    @answerA,
                    @answerB,
                    @answerC,
                    @answerD,
                    @correctAnswer,
                    @creatorEmail
                )
            `);

        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Speichern der Frage:', error);
        res.status(500).json({ success: false, message: 'Fehler beim Speichern der Frage' });
    }
});

// Fragen abrufen
app.get('/api/questions', async (req, res) => {
    try {
        if (!req.session.isLoggedIn) {
            return res.status(401).json({ success: false, message: 'Nicht eingeloggt' });
        }

        const config = await getDbConfig();
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('email', sql.VarChar, req.session.email)
            .query('SELECT * FROM QuizQuestions WHERE creatorEmail = @email');
        res.json(result.recordset);
    } catch (error) {
        console.error('Fehler beim Abrufen der Fragen:', error);
        res.status(500).json({ success: false, message: 'Datenbankfehler' });
    }
});

// Frage löschen
app.delete('/api/questions/:id', async (req, res) => {
    try {
        const config = await getDbConfig();
        const pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM QuizQuestions WHERE id = @id');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Löschen' });
    }
});

// Logout Route
app.post('/api/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.json({ success: true });
        });
    } else {
        res.json({ success: false });
    }
});

// Alle Fragen abrufen
app.get('/api/all-questions', async (req, res) => {
    try {
        const config = await getDbConfig();
        const pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM QuizQuestions');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Datenbankfehler' });
    }
});

// Score speichern
app.post('/api/save-score', async (req, res) => {
    try {
        if (!req.session.isLoggedIn) {
            return res.status(401).json({ message: 'Nicht eingeloggt' });
        }

        const config = await getDbConfig();
        const pool = await sql.connect(config);
        await pool.request()
            .input('email', sql.VarChar(255), req.session.email || '')
            .input('score', sql.Int, req.body.score || 0)
            .query(`
                INSERT INTO Highscores (email, score)
                VALUES (@email, @score)
            `);
            
        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Highscores abrufen
app.get('/api/highscores', async (req, res) => {
    try {
        const config = await getDbConfig();
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT TOP 10 email, score, played_at 
                FROM Highscores 
                ORDER BY score DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Datenbankfehler' });
    }
});

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf Port ${port}`);
});