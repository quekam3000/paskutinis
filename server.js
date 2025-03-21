const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const PORT = 5000;

// Nustatyk failų išsaugojimo katalogą
const DOWNLOAD_DIR = 'D:/edit/clips'; // Failai bus išsaugomi į "D:\edit\clips"

// Įsitikink, kad katalogas egzistuoja
const fs = require('fs');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true }); // Sukurk katalogą, jei jis neegzistuoja
}

// Įjungti CORS palaikymą
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Leidžia visoms kilmėms
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Leidžiami metodai
    res.header('Access-Control-Allow-Headers', 'Content-Type'); // Leidžiamos antraštės
    next();
});

// Proxy endpoint'as
app.get('/download', async (req, res) => {
    const { url, format } = req.query; // Gauk URL ir formatą iš užklausos

    console.log('Gauta užklausa:', { url, format }); // Rodyk užklausą terminale

    if (!url || !format) {
        console.error('Trūksta URL arba formato.'); // Rodyk klaidą terminale
        return res.status(400).json({ error: 'Trūksta URL arba formato.' });
    }

    try {
        // Nustatyk vaizdo kokybę arba audio formatą pagal platformą
        let quality;
        if (url.includes('tiktok.com')) {
            // TikTok atveju naudokite geriausią kokybę
            quality = 'best';
        } else if (url.includes('spotify.com')) {
            // Spotify atveju naudokite audio formatą
            quality = 'bestaudio';
        } else {
            // YouTube ir kitoms platformoms
            quality = format === 'mp3' ? 'bestaudio' : 'bestvideo[height<=1080]+bestaudio/best[height<=1080]';
        }

        // Naudok yt-dlp, kad parsisiųsti vaizdo įrašą arba audio failą
        const outputTemplate = path.join(DOWNLOAD_DIR, `%(title)s.${format}`); // Failo pavadinimo šablonas
        exec(`yt-dlp -f "${quality}" -o "${outputTemplate}" ${url}`, (error, stdout, stderr) => {
            if (error) {
                console.error('Klaida:', stderr);
                return res.status(500).json({ error: 'Nepavyko parsisiųsti.' });
            }

            // Išskirk failo pavadinimą iš stdout
            const outputFileName = stdout.match(/\[download\] Destination: (.+)/)?.[1];
            if (!outputFileName) {
                console.error('Nepavyko gauti failo pavadinimo.');
                return res.status(500).json({ error: 'Nepavyko gauti failo pavadinimo.' });
            }

            // Grąžink atsisiuntimo nuorodą
            res.json({ downloadUrl: `file:///${outputFileName.replace(/\\/g, '/')}` });
        });
    } catch (error) {
        console.error('Klaida proxy serveryje:', error);
        res.status(500).json({ error: 'Įvyko klaida proxy serveryje.' });
    }
});

// Paleisk serverį
app.listen(PORT, () => {
    console.log(`Proxy serveris veikia ant http://localhost:${PORT}`);
});
