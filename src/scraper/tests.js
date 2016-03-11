'use strict';

import iconv from 'iconv-lite';
import util from 'util';

import {rtfToHtml, promisifiedExec} from './utils';
import { trimString, promisifiedReadFs } from './utils';
import { parseSession } from './session-parser';
import { getDownloadedRTF, saveObjects } from './mongo-client';

const baseUrl = 'http://www.diputados.gov.py/plenaria/';
const sessionListURI = baseDir + 'sesiones2015.html';
const sessionHTMLFiles = ['151216-SO.html', '151216-SO_2.html','151008-SE.html',
			  '151103-SE.html', '151216-SO.html', '150903-SO.html'];
const baseDir = '/Data/devel/projects/tedic/src/PaScrapper/resources/';
const sessionDetailURI = baseDir + sessionHTMLFiles[5];//'151216-SO.html';

let testRTFParse = () => {
    promisifiedExec(util.format('unrtf --html %s', rtfFile4))
    .then( (html) => {
	let data = votingHTMLParser(html);
	console.log(data.date);
    }).catch( (error) => {
	console.log(error);
    });
};

promisifiedReadFs(sessionDetailURI, 'utf8').then( (data) => {
    let html = iconv.decode(new Buffer(data), 'win1252');
    let result = parseSession(html);
    //console.log(result.details);
    for(let d of result.details){
	console.log(d.votings);
    }
    
}).catch( (error) => {
    console.trace(error);
});

