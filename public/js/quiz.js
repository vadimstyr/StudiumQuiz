let correctAnswersCount = 0;

$(document).ready(() => {
    let questions = [];
    let currentQuestionIndex = 0;
    let hasAnswered = false; // Verhindert mehrfaches Antworten pro Frage

    const checkAuthAndLoadQuestions = async () => {
        try {
            const authResponse = await $.get('/api/check-auth');
            if (!authResponse.isLoggedIn) {
                $('#nextQuestion').hide();
                $('.answer-container').hide();
                return;
            }

            const questionsResponse = await $.get('/api/questions');
            questions = questionsResponse;
            if (questions.length > 0) {
                displayQuestion(0);
                updateQuestionCounter(); // Zeigt Fragenfortschritt
                $('#nextQuestion').show();
                $('.answer-container').show();
                $('main p').hide();
            }
        } catch (error) {
            console.error('Fehler:', error);
        }
    };

    const displayQuestion = (index) => {
        const question = questions[index];
        $('#currentQuestion').text(question.question);
        $('#A').text(`A: ${question.answerA}`);
        $('#B').text(`B: ${question.answerB}`);
        $('#C').text(`C: ${question.answerC}`);
        $('#D').text(`D: ${question.answerD}`);
        hasAnswered = false; // Zurücksetzen für neue Frage
        updateQuestionCounter();
    };

    // Neue Funktion für Fragenfortschritt
    const updateQuestionCounter = () => {
        $('.question-counter').text(`Frage ${currentQuestionIndex + 1} von ${questions.length}`);
    };

    $('.answer').click(function() {
        if (hasAnswered) return; // Verhindert mehrfaches Antworten
        hasAnswered = true;

        const selectedAnswer = $(this).attr('id');
        const question = questions[currentQuestionIndex];
        
        if (selectedAnswer === question.correctAnswer) {
            correctAnswersCount++;
            $(this).addClass('correct');
        } else {
            $(this).addClass('incorrect');
            $(`#${question.correctAnswer}`).addClass('correct');
        }

        // Aktiviere den "Weiter"-Button nach der Antwort
        $('#nextQuestion').prop('disabled', false);
    });

    $('#nextQuestion').click(() => {
        if (!hasAnswered && currentQuestionIndex < questions.length) {
            alert('Bitte wähle erst eine Antwort aus!');
            return;
        }

        $('.answer').removeClass('correct incorrect');
        currentQuestionIndex++;
        
        if (currentQuestionIndex >= questions.length) {
            showQuizEnd(correctAnswersCount, questions.length);
        } else {
            displayQuestion(currentQuestionIndex);
        }
    });

    // Deaktiviere initial den "Weiter"-Button
    $('#nextQuestion').prop('disabled', true);
    
    checkAuthAndLoadQuestions();
});

function showQuizEnd(correctAnswers, totalQuestions) {
    $('.quiz-container').html(`
        <div class="quiz">
            <h1>Quiz beendet!</h1>
        </div>
        <div class="quizzQuestion">
            <h2>Du hast ${correctAnswers} von ${totalQuestions} Fragen richtig beantwortet! (${Math.round((correctAnswers / totalQuestions) * 100)}%)</h2>
        </div>
        <div class="quiz-buttons">
            <button onclick="location.reload()" class="quiz-button">Quiz neu starten</button>
            <button onclick="window.location.href='/html/quizMode.html'" class="quiz-button">Spielmodus wählen</button>
        </div>
    `);
}