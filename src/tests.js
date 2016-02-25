'use strict';

import {rtfToHtml, promisifiedExec} from './utils';
import iconv from 'iconv-lite';

import { parseSession } from './session-parser';
import { trimString, promisifiedFs } from './utils';
import { votingHTMLParser } from './rtf-parser';

const baseUrl = 'http://www.diputados.gov.py/plenaria/';
const sessionListURI = baseDir + 'sesiones2015.html';
const sessionHTMLFiles = ['151216-SO.html', '151216-SO_2.html','151008-SE.html',
			  '151103-SE.html', '151216-SO.html'];
const baseDir = '/Data/devel/projects/tedic/src/PaScrapper/resources/';
const sessionDetailURI = baseDir + sessionHTMLFiles[0];//'151216-SO.html';


//read all rtfs
//console.log();
//__dirname
rtfToHtml(baseDir + 'rtf');
import fs from 'fs';

let commands = rtfToHtml(__dirname + '../rtf/');
console.log(commands[0]);
let results = [];
commands.reduce( (sequence, command) => {
    return sequence.then( () => {
	promisifiedExec(command).then( (result) => {
	    return result;
	}).then( (html) => {
	    votingHTMLParser(html);
	});
    }).catch( (err) => {
	console.trace(err);
    });;
}, Promise.resolve());

