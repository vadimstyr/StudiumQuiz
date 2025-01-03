$(document).ready(() => {
    $('#anmeldenButton').on('click', async () => {
        // Hole die Eingabewerte
        const email = $('.e-email-answer').val().trim();
        const password = $('.passwort-answer').val().trim();

        // Validierung
        if (!email || !password) {
            alert('Bitte füllen Sie alle Felder aus.');
            return;
        }

        try {
            // Sende die Daten an den Server
            const response = await $.ajax({
                url: '/api/login',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ email, password })
            });

            if (response.success) {
                // Erfolgreicher Login
                alert('Login erfolgreich!');
                window.location.href = 'quiz.html'; // Weiterleitung zur Quiz-Seite
            } else {
                // Fehlgeschlagener Login
                alert(response.message || 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
            }
        } catch (error) {
            console.error('Login-Fehler:', error);
            alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
        }
    });

    // Enter-Taste Unterstützung
    $('.e-email-answer, .passwort-answer').on('keypress', (e) => {
        if (e.which === 13) { // Enter-Taste
            $('#anmeldenButton').click();
        }
    });
});