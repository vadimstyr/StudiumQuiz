const bcrypt = require('bcrypt');
const sql = require('mssql');
require('dotenv').config();

// Datenbank-Konfiguration
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

async function verifyLogin(email, password) {
    try {
        console.log('Versuche Login für:', email); // Debug-Log
        
        // Verbindung zur Datenbank herstellen
        const pool = await sql.connect(config);
        
        // Benutzer in der Datenbank suchen - Alle Benutzerdaten abrufen
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM UsersLogin WHERE email = @email'); // Wichtig: SELECT *

        if (result.recordset.length === 0) {
            console.log('Benutzer nicht gefunden:', email);
            return { success: false, message: 'Benutzer nicht gefunden.' };
        }

        // Passwort überprüfen
        const user = result.recordset[0];
        const isValid = await bcrypt.compare(password, user.password);

        if (isValid) {
            console.log('Login erfolgreich für:', email);
            // Gebe zusätzliche Benutzerinformationen zurück
            return { 
                success: true, 
                message: 'Login erfolgreich!',
                user: {
                    id: user.id,
                    email: user.email
                }
            };
        } else {
            console.log('Falsches Passwort für:', email);
            return { success: false, message: 'Falsches Passwort.' };
        }

    } catch (error) {
        console.error('Login-Fehler:', error);
        return { success: false, message: 'Ein Server-Fehler ist aufgetreten.' };
    }
}

module.exports = { verifyLogin };