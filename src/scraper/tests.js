'use strict';

import iconv from 'iconv-lite';
import util from 'util';

import {rtfToHtml, promisifiedExec} from './utils';
import { trimString, promisifiedReadFs } from './utils';
import { parseSession } from './session-parser';
import { votingHTMLParser } from './rtf-parser';
import { getDownloadedRTF, saveObjects } from './mongo-client';

const baseUrl = 'http://www.diputados.gov.py/plenaria/';
const sessionListURI = baseDir + 'sesiones2015.html';
const sessionHTMLFiles = ['151216-SO.html', '151216-SO_2.html','151008-SE.html',
			  '151103-SE.html', '151216-SO.html'];
const baseDir = '/Data/devel/projects/tedic/src/PaScrapper/resources/';
const sessionDetailURI = baseDir + sessionHTMLFiles[0];//'151216-SO.html';

const rtfFile1 = '/Data/devel/projects/tedic/src/PaScrapper/src/../rtf/03p09rat.rtf';
const rtfFile2 = '/Data/devel/projects/tedic/src/PaScrapper/src/../rtf/13p09ag.rtf';
const rtfFile3 = '/Data/devel/projects/tedic/src/PaScrapper/resources/03p01apr.rtf';//works
const rtfFile4 = '/Data/devel/projects/tedic/src/PaScrapper/src/../rtf/00REG01.rtf';

let testRTFParse = () => {
    promisifiedExec(util.format('unrtf --html %s', rtfFile4))
    .then( (html) => {
	let data = votingHTMLParser(html);
	console.log(data.date);
    }).catch( (error) => {
	console.log(error);
    });
}

let parseRTF = () => {
    getDownloadedRTF().then( (list) =>{
	let commands = [];
	for(let l of list){
	    promisifiedExec(util.format('unrtf --html %s', l.fileName))
		.then( (html) => {	    
		    let data = votingHTMLParser(html);
		    //console.log(l.fileName, data.date);
		    for (let k in data){
		    	l[k] = data[k];
		    }
		    saveObjects('votings', l);
		    
		}).catch( (error) => {
		    console.log(error);
		});
	}
    });    
};

//testRTFParse();
parseRTF();
