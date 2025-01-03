$(document).ready(() => {
    let score = 0;
    let questions = [];
    let currentQuestionIndex = 0;
    let hasAnswered = false;

    const checkAuthAndLoadQuestions = async () => {
        try {
            const authResponse = await $.get('/api/check-auth');
            if (!authResponse.isLoggedIn) {
                window.location.href = '/html/userNameLoginIndex.html';
                return;
            }

            $('#playerInfo').text(`Spieler: ${authResponse.email}`);
            await loadQuestions();
            await loadHighscores(); // Ändere loadLeaderboard zu loadHighscores
        } catch (error) {
            console.error('Fehler:', error);
        }
    };

    const loadQuestions = async () => {
        try {
            const response = await $.get('/api/all-questions');
            questions = response;
            if (questions.length > 0) {
                displayQuestion(0);
                updateQuestionCounter();
            }
        } catch (error) {
            console.error('Fehler beim Laden der Fragen:', error);
        }
    };

    const loadHighscores = async () => {
        try {
            const response = await $.get('/api/highscores');
            const top5Scores = response.slice(0, 5); // Nur die Top 5 anzeigen
            const highscoresHtml = top5Scores.map((score, index) => `
                <div class="highscore-entry">
                    <span class="rank">${index + 1}.</span>
                    <span class="player">${score.email}</span>
                    <span class="score">${score.score} Punkte</span>
                </div>
            `).join('');
            
            $('.leaderboard').html(`
                <h2>Bestenliste</h2>
                <div class="highscore-list">
                    ${highscoresHtml}
                </div>
            `);
        } catch (error) {
            console.error('Fehler beim Laden der Bestenliste:', error);
        }
     };
    const displayQuestion = (index) => {
        const question = questions[index];
        $('#currentQuestion').text(question.question);
        $('#A').text(`A: ${question.answerA}`);
        $('#B').text(`B: ${question.answerB}`);
        $('#C').text(`C: ${question.answerC}`);
        $('#D').text(`D: ${question.answerD}`);
        hasAnswered = false;
        updateQuestionCounter();
    };

    const updateQuestionCounter = () => {
        $('#questionCounter').text(`Frage ${currentQuestionIndex + 1} von ${questions.length}`);
    };

    $('.answer').click(function() {
        if (hasAnswered) return;
        hasAnswered = true;

        const selectedAnswer = $(this).attr('id');
        const question = questions[currentQuestionIndex];
        
        if (selectedAnswer === question.correctAnswer) {
            score += 100;
            $(this).addClass('correct');
            $('#score').text(`Punkte: ${score}`);
        } else {
            $(this).addClass('incorrect');
            $(`#${question.correctAnswer}`).addClass('correct');
        }

        $('#nextQuestion').prop('disabled', false);
    });

    $('#nextQuestion').click(async () => {
        if (!hasAnswered && currentQuestionIndex < questions.length) {
            alert('Bitte wähle erst eine Antwort aus!');
            return;
        }
    
        try {
            if (currentQuestionIndex >= questions.length - 1) {
                await $.ajax({
                    url: '/api/save-score',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ score })
                });
                await loadHighscores();
                showQuizEnd(score);
            } else {
                currentQuestionIndex++;
                $('.answer').removeClass('correct incorrect');
                displayQuestion(currentQuestionIndex);
            }
        } catch (error) {
            console.error('Fehler:', error);
        }
    });

    const showQuizEnd = (finalScore) => {
        $('.quiz-container').html(`
            <div class="quiz-end">
                <h2>Quiz beendet!</h2>
                <p>Dein Endergebnis: ${finalScore} Punkte</p>
                <button onclick="location.reload()" class="restart-button">Nochmal spielen</button>
                <button onclick="window.location.href='/html/quizMode.html'" class="mode-button">Zurück zur Modusauswahl</button>
            </div>
        `);
    };

    $('#nextQuestion').prop('disabled', true);
    checkAuthAndLoadQuestions();
});