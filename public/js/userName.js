$(document).ready(() => {
    $('.username-link').click(async (e) => {
        e.preventDefault();
        try {
            const response = await $.ajax({
                url: '/api/logout',
                method: 'POST',
                xhrFields: { withCredentials: true }
            });
            window.location.href = '/html/userNameLoginIndex.html';
        } catch (error) {
            console.error('Logout-Fehler:', error);
        }
    });
});