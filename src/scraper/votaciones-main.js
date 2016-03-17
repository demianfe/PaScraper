'use strict';
import http from 'http';
import util from 'util';
import request from 'request-promise';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import fs from 'fs';

import { parseSession } from './session-parser';
import { votingHTMLParser } from './rtf-parser';
import { trimString, promisifiedReadFs, promisifiedExec } from './utils';
import { getDownloadedRTF, saveObjects, getSessionById,
	 upsertObject, saveSession, getRTFLinks } from './mongo-client';

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
    form: {anho: '2013'}
};

export let crawlSessions = (queryObj) => request(options).then( (htmlString) => {    
    options.form = Object.assign({}, queryObj);
    console.log('Downloading sessions from: ', options.form.anho);
    // Process html...
    let html = iconv.decode(new Buffer(htmlString), 'win1252');
    let links = parseSessionList(htmlString);
    links.reduce( (sequence, link) => {
	return sequence.then( () => {
	    return request({url: link, encoding: 'binary'}) .then( (body) => {
		console.log('Downloading => ', link);
		let sessionHtml = iconv.decode(body, 'win1252');
		let session = parseSession(sessionHtml);
		session.year = options.form.anho;
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

let downloadRTF = (link) => {
    return new Promise( (resolve, reject) => {
	console.log('downloading \n', link.url);
	promisifiedExec('curl ' + link.url + ' -o ' + link.fileName)
	    .then( (stdout) => {
		resolve(link);
	    }).catch( (error) => {
		console.log(error);
	    });
    });
};

//TODO:recieve a list of objects instead
//with data related to the session
export let downloadRTFs = () => {
    let arr;
    getRTFLinks().then( (links) => {
	links.reduce( (sequence, link) => {
	    return sequence.then( () =>{
		let url  = host + '/plenaria/'+ link.link;
		arr  = url.split('/');
		let fileName = arr[arr.length - 1];
		fileName = __dirname + '/../../rtf/' + fileName;
		link.url = url;
		link.fileName = fileName;
		if(link.url.indexOf('.mp3') == -1){
		    return downloadRTF(link).then( (link) => {
			console.log('----------------------------');
			console.log(link);
			saveObjects('downladed_rtf', link);
			console.log('----------------------------');
		    });
		}else{
		    return null;
		}
	    }).catch( (err) => {
		console.trace(err);
	    });
	}, Promise.resolve());
    });
};

let saveVoting = (rtfData, session) =>{
    let detailsIndex = 0;
    while(detailsIndex < session.details.length){
	let sd = session.details[detailsIndex];
	if(sd !== undefined && sd.votings !== undefined){
	    let votingIndex = 0;
	    while(votingIndex < sd.votings.length){
		let v = sd.votings[votingIndex];
		//for(let v of sd.votings){
		if(rtfData.link.search(v.link) !== -1){
		    rtfData.year = session.year;
		    rtfData.result = v.title;
		    rtfData.president = session.PRESIDENTE
			.replace(": Diputado Nacional ","");
		    console.log(rtfData._id);
		    saveObjects('votings', rtfData);
		    detailsIndex = session.details.length;//breaks while
		    break;
		}
		votingIndex++;
	    }
	}
	detailsIndex++;
    }
};

let parseRTF = () => {    
    getDownloadedRTF().then( (rtfList) =>{
	for(let rtf of rtfList){
	    promisifiedExec(util.format('unrtf --html %s', rtf.fileName))
		.then( (html) => {	    
		    console.log('Parsing ', rtf.fileName);
		    let data = votingHTMLParser(html);
		    for (let k in data){
		    	rtf[k] = data[k];
		    }
		    return rtf;
		}).then( (rtfData) => {
		    getSessionById(rtfData.session_id).then( (session) => {
			//iterate over session.votings and merge with rtfData
			saveVoting(rtfData, session);
		    });
		}).catch( (error) => {
		    console.log(error);
		});
	}
    });    
};

parseRTF();
//crawlSessions();
//downloadRTFs();
