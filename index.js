'use strict';

import request from 'request-promise';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

import { parseSession } from './session-parser';
import { saveSession } from './db-client';

const baseUri = 'http://www.diputados.gov.py/ww1/?pagina=sesiondigital';

let parseSessionList = (htmlString) => {
    let $ = cheerio.load(htmlString);
    let links = $('a.menu').map((i, elem) => {
	return elem.attribs.href;
    });
    //todo extract options?
    return links;
};

//TODO:
// Navigation section
let options = {
    method: 'POST',
    uri: 'http://www.diputados.gov.py/plenaria/151216-SO/',
    form: {anho: '2015'}
};

let executeRquest = () => request(options)
    .then(function (htmlString) {
        // Process html...
	let html = iconv.decode(new Buffer(htmlString), 'win1252');
	//let html = decodeURIComponent(escape(htmlString));
	console.log(parseSessionList(html));
    }).catch( (err) => {
        // Crawling failed...
	console.log(err);
    });

executeRquest();

