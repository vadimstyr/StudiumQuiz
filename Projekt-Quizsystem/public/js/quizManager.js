$(document).ready(() => {
    let currentUser = null;
    let userQuestions = [];
    let currentQuestionIndex = 0;

    // Auth-Check mit erweiterten Debug-Logs
    const checkAuthAndLoadUser = async () => {
        console.log('Start: Auth-Check');
        try {
            console.log('Sende Auth-Request...');
            const response = await $.ajax({
                url: '/api/check-auth',
                method: 'GET',
                xhrFields: {
                    withCredentials: true
                }
            });
            console.log('Auth-Response erhalten:', response);

            if (!response.isLoggedIn) {
                console.log('Nicht eingeloggt - Weiterleitung wird vorbereitet...');
                // Verzögerung vor Weiterleitung
                setTimeout(() => {
                    window.location.href = '/html/userNameLoginIndex.html';
                }, 2000);
                return;
            }
            
            console.log('Login bestätigt für:', response.email);
            currentUser = response.email;
            $('#userEmail').text(currentUser);
            await loadUserQuestions();
        } catch (error) {
            console.error('Detaillierter Auth-Fehler:', error);
            // Verzögerung vor Weiterleitung
            setTimeout(() => {
                window.location.href = '/html/userNameLoginIndex.html';
            }, 5000);
        }
    };

    // Fragen laden
    const loadUserQuestions = async () => {
        try {
            const response = await $.get('/api/questions');
            userQuestions = response;
            updateQuestionCount();
            displayCurrentQuestion();
        } catch (error) {
            console.error('Fehler beim Laden der Fragen:', error);
        }
    };

    // Frage speichern
    $('#saveQuestion').click(async () => {
        console.log('Speichern-Button geklickt');
        
        if (userQuestions.length >= 10) {
            alert('Sie können maximal 10 Fragen erstellen!');
            return;
        }

        const questionData = {
            question: $('#questionInput').val(),
            answers: {
                A: $('#answerA').val(),
                B: $('#answerB').val(),
                C: $('#answerC').val(),
                D: $('#answerD').val()
            },
            correctAnswer: $('#correctAnswer').val()
        };

        try {
            await $.ajax({
                url: '/api/questions',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(questionData)
            });

            alert('Frage erfolgreich gespeichert!');
            clearInputs();
            await loadUserQuestions();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern der Frage.');
        }
    });

    // Frage löschen
    $('#deleteQuestion').click(async () => {
        if (userQuestions.length === 0) return;

        try {
            await $.ajax({
                url: `/api/questions/${userQuestions[currentQuestionIndex].id}`,
                method: 'DELETE'
            });

            await loadUserQuestions();
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            alert('Fehler beim Löschen der Frage.');
        }
    });

    // Navigation
    $('#prevQuestion').click(() => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayCurrentQuestion();
        }
    });

    $('#nextQuestion').click(() => {
        if (currentQuestionIndex < userQuestions.length - 1) {
            currentQuestionIndex++;
            displayCurrentQuestion();
        }
    });

    // Hilfsfunktionen
    const updateQuestionCount = () => {
        $('#questionCount').text(userQuestions.length);
    };

 // Beim Speichern einer Frage:
const questionData = {
    question: $('#questionInput').val(),
    answerA: $('#answerA').val(),
    answerB: $('#answerB').val(),
    answerC: $('#answerC').val(),
    answerD: $('#answerD').val(),
    correctAnswer: $('#correctAnswer').val()
};

// Beim Anzeigen:
const displayCurrentQuestion = () => {
    if (userQuestions.length === 0) {
        $('#previewQuestion').text('Keine Fragen vorhanden');
        $('#previewAnswers').empty();
        $('#correctAnswerDisplay').text('');
        $('#currentQuestionNumber').text('Frage 0/0');
        return;
    }

    const question = userQuestions[currentQuestionIndex];
    console.log('Aktuelle Frage:', question); // Debug-Log
    $('#previewQuestion').text(question.question);
    $('#previewAnswers').html(`
        <div>A: ${question.answerA}</div>
        <div>B: ${question.answerB}</div>
        <div>C: ${question.answerC}</div>
        <div>D: ${question.answerD}</div>
    `);
    $('#correctAnswerDisplay').text(`Richtige Antwort: ${question.correctAnswer}`);
    $('#currentQuestionNumber').text(`Frage ${currentQuestionIndex + 1}/${userQuestions.length}`);
};

    const clearInputs = () => {
        $('#questionInput').val('');
        $('#answerA').val('');
        $('#answerB').val('');
        $('#answerC').val('');
        $('#answerD').val('');
        $('#correctAnswer').val('A');
    };

    // Start mit Auth-Check und User-Load
    checkAuthAndLoadUser();
});