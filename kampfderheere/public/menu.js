user_id = null;

function toggleNav() {
    document.getElementById('nav-links').classList.toggle('open');
}


async function startGame(mode) {
    if(mode === "human"){
        const response = await fetch("/spielraum");
        const data = await response.json();
        user_id = data.user_id;
        const new_html = data.html;
        document.body.innerHTML = new_html;
    }
    else {
        window.location.href = `./game`;
    }
}

function showScoreboard() {
    window.location.href = `./scoreboard`;
}

function nav_to_menu(){
    window.location.href = `./`;
}


function getUsername() {
    return fetch('/api/me')
        .then(response => response.json())
        .then(data => data.user.username)
        .catch(error => {
            console.error('Fehler beim Abrufen des Benutzernamens:', error);
            return null;
        });     
}

getUsername().then(username => {
    if (username) {
        document.getElementById('username_display').textContent = username;
    }
});