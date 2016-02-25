'use strict';
import http from 'http';
import request from 'request-promise';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

import fs from 'fs';

import { parseSession } from './session-parser';
import { saveSession, getRTFLinks } from './db-client';

const host = 'http://www.diputados.gov.py';
const baseUrl = host + '/ww1/?pagina=sesiondigital';

let parseSessionList = (htmlString) => {
    let $ = cheerio.load(htmlString);
    let links = [];
    $('a.menu').each((i, elem) => {
	//'javascript:history.go(-1)'
	let link = $(elem).attr('href');
	link = link.replace('..', host);
	if (link !== 'javascript:history.go(-1)'){
	    links.push(link);
	}
    });
    return links;
};

//example 'http://www.diputados.gov.py/plenaria/151216-SO/'
//TODO:
// Navigation section
let options = {
    method: 'POST',
    uri: baseUrl,
    form: {anho: '2015'}
};

let crawlSessions = () => request(options).then( (htmlString) => {
        // Process html...
	let html = iconv.decode(new Buffer(htmlString), 'win1252');
	let links = parseSessionList(htmlString);
	links.reduce( (sequence, link) => {
	    return sequence.then( () => {
		return request({url: link, encoding: 'binary'}) .then( (body) => {
		    console.log('Downloading => ', link);
		    let sessionHtml = iconv.decode(body, 'win1252');
		    let session = parseSession(sessionHtml);
		    session.url = link;
		    let arr = link.split('/');
		    session.id = arr[arr.length - 1];
		    saveSession(session);
		});
	    }).catch( (err) => {
		console.trace(err);
	    });
	}, Promise.resolve());
    }).catch( (err) => {
	console.trace(err);
    });


let downloadRTF = (link, fileName) => {
    return new Promise( (resolve, reject) => {
	//request(link).pipe(fs.createWriteStream(fileName));
	let file = fs.createWriteStream(fileName);
	http.get(link, (res) => {
	    res.on('data', (data) => {
		file.write(data);
	    }).on('end', () =>{
		file.end();
		//TODO: save to the database
		// session.id, link, filename
		console.log('downloaded to ' + fileName);
	    });
	});
    });
};

let downloadRTFs = () => {
    let arr;
    getRTFLinks().then( (links) => {
	links.reduce( (sequence, link) => {
	    return sequence.then( () =>{
		link = host + '/plenaria/'+ link;
		arr  = link.split('/');
		let fileName = arr[arr.length - 1];
		fileName = __dirname + '../rtf/' + fileName;
		downloadRTF(link, fileName);
	    }).catch( (err) => {
		console.trace(err);
	    });
	}, Promise.resolve());
    });
};

