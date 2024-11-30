$(document).ready(function() {
    // Array zur Speicherung der Fragen und Antworten
    let questionsArray = [];

    // Event-Handler für das Formular
    $('#questionForm').on('submit', function(event) {
        event.preventDefault(); // Standardaktion verhindern (keine Seitenerneuerung)

        // Die Frage und Antworten abrufen
        let question = $('#question').val();
        let answers = [];

        $('.answerInput').each(function() {
            answers.push($(this).val());
        });

        // Objekt zur Frage und den Antworten erstellen
        let questionObject = {
            frage: question,
            antworten: answers
        };

        // Das Objekt dem Array hinzufügen
        questionsArray.push(questionObject);

        // Das Formular zurücksetzen
        $('#questionForm')[0].reset();

        // Die neue Frage und Antworten anzeigen
        displayCurrentQuestion(questionObject);
    });

    // Funktion, um die aktuelle Frage und Antworten anzuzeigen
    function displayCurrentQuestion(questionObject) {
        $('#currentQuestion').text(questionObject.frage);
        $('#A').text("A: " + questionObject.antworten[0]);
        $('#B').text("B: " + questionObject.antworten[1]);
        $('#C').text("C: " + questionObject.antworten[2]);
        $('#D').text("D: " + questionObject.antworten[3]);
    }

});
