function getApps() {
    return fetch('/api/apps')
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('Fehler beim Abrufen der Apps:', error);
            return [];
        });
}




function updateSide_menu() {
    getApps().then(apps => {
        const sideMenu = document.getElementsByClassName('side_menu')[0];
        const urls_menu = sideMenu.querySelector('ul');
        urls_menu.innerHTML = ''; 

        const items = Object.values(apps);


        items.forEach(app => {
            const menuItem = document.createElement('li');
            const link = document.createElement('a');
            link.addEventListener('click', () => loadContent(app.path));
            link.textContent = app.name;
            link.style.backdropFilter = `blur(5px)`;
            link.style.backgroundColor = app.color;
            menuItem.appendChild(link);
            urls_menu.appendChild(menuItem);
        });

    });
}

function loadContent(link_path) {
    const contentFrame = document.getElementById('content_frame');
    const fullPath = '/apps/' + link_path;
    console.log('Lade Inhalt von:', fullPath);
    contentFrame.src = fullPath + '/main';
    contentFrame.style.visibility = 'visible';
    const sideMenu = document.getElementsByClassName('side_menu')[0];
    const urls_menu = sideMenu.querySelector('ul');
    urls_menu.innerHTML = ''; 
    getApps().then(apps => {
        const items = Object.values(apps);
        items.forEach(app => {
            if (app.path === link_path) {
                const sub_paths = app.sub_paths;
                const items = Object.values(sub_paths);
                items.forEach(sub_path => {
                    const menuItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.addEventListener('click', () => {
                        const subFullPath = fullPath + '/' + sub_path.path;
                        console.log('Lade Inhalt von:', subFullPath);
                        contentFrame.src = subFullPath;
                    });
                    link.textContent = sub_path.name;
                    link.style.backdropFilter = `blur(5px)`;
                    menuItem.appendChild(link);
                    urls_menu.appendChild(menuItem);
                });
                
            }
        });
    });
}


updateSide_menu();

