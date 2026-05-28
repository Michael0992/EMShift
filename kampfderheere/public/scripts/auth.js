if (window.location.pathname === '/login') {
    document.getElementById('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault(); // Verhindert das Standardverhalten des Formulars (Seitenneuladen)
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            const contentType = response.headers.get('Content-Type');
            const data = contentType?.includes('application/json')
            ? await response.json()
            : { message: 'Ein unerwarteter Fehler ist aufgetreten.' };

            if (response.ok) {
                // Erfolgreiches Login
                window.location.href = '/'; // Weiterleitung nach dem Login
            } else {
                // Fehler beim Login
                alert(data.message);
            }
        } catch (error) {
            alert('Fehler beim Login: ' + error);
        }
    });
}

document.getElementById('registerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const avatar = document.getElementById('avatar').files[0];

    if (password !== confirmPassword) {
        alert('Passwörter stimmen nicht überein');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('confirm_password', confirmPassword);
        formData.append('avatar', avatar);

        const response = await fetch('/api/register', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            // Erfolgreiche Registrierung
            window.location.href = '/login'; // Weiterleitung nach der Registrierung
        } else {
            // Fehler bei der Registrierung
            const contentType = response.headers.get('Content-Type');
            const data = contentType?.includes('application/json')
                ? await response.json()
                : { message: 'Ein unerwarteter Fehler ist aufgetreten.' };
            alert(data.message);
        }
    } catch (error) {
        alert('Fehler bei der Registrierung: ' + error);
    }
});