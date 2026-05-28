const express = require('express');
const app = express();
const PORT = 3002;
const fs = require('fs');
const appDataPath = './apps/available_apps.json';
const availableApps = JSON.parse(fs.readFileSync(appDataPath, 'utf-8'));


console.log('Verfügbare Apps:', availableApps);
app.use(express.static('public', {
    extensions: ['html']
}));

app.get('/api/apps', (req, res) => {
    res.json(availableApps);
});


app.listen(PORT, () => {
    console.log(`Admin Panel läuft auf http://localhost:${PORT}`);
});