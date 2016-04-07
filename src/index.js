/* 
 author: Demian Florentin <demian@tedic.org>

 Entry point through rest services.
*/

import express from 'express';
import url from 'url';
import { downloadRTFs, crawlSessions } from './scraper/votaciones-main';

let app = express();

app.get('/', (req, res) => {
    res.send('Nothing to do here yet.');
});


app.get('/votaciones/sesiones', (req, res) => {
    //TODO: manage asynchronicity
    let urlParts = url.parse(req.url, true);
    crawlSessions(urlParts.query);
    res.send('crawling sessions...');
});

app.get('/rtf', (req, res) => {
    //TODO: manage asynchronicity
    downloadRTFs();
    res.send('Downloading rtfs');
});


app.listen(3000);
