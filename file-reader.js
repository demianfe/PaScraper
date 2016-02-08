'use strict';

import iconv from 'iconv-lite';

import { parseSession } from './session-parser';
import { trimString, promisifiedFs } from './utils';

const sessionListURI = baseDir + 'sesiones2015.html';
const sessionHTMLFiles = ['151216-SO.html', '151008-SE.html',
			  '151103-SE.html', '151216-SO.html'];
const baseDir = '/Data/devel/projects/tedic/src/PaScrapper/resources/';
const sessionDetailURI = baseDir + sessionHTMLFiles[1];//'151216-SO.html';




// let readDetail = promisifiedFs(sessionDetailURI)
//     .then((data) => {
//     data = iconv.decode(new Buffer(data), 'win1252');
//     let result = parseSession(data);
//     console.log(result);
//     //saveSession(result);
// }).catch( (error) => {
//     console.error(error);
//     //console.trace(error);
// });

