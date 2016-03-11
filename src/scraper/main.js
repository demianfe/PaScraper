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
    form: {anho: '2015'}
};

export let crawlSessions = () => request(options).then( (htmlString) => {
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

let downloadRTF = (link) => {
    return new Promise( (resolve, reject) => {
	//request(link).pipe(fs.createWriteStream(fileName));
	let file = fs.createWriteStream(link.fileName);
	http.get(link.url, (res) => {
	    res.on('data', (data) => {
		file.write(data);
	    }).on('end', () =>{
		file.end();
		console.log('saved file to ', link.fileName);
		resolve(link);
	    });
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
		fileName = __dirname + '/../rtf/' + fileName;
		link.url = url;
		link.fileName = fileName;
		downloadRTF(link).then( (link) => {
		    console.log('----------------------------');
		    console.log(link);
		    saveObjects('downladed_rtf', link);
		    console.log('----------------------------');
		});
	    }).catch( (err) => {
		console.trace(err);
	    });
	}, Promise.resolve());
    });
};

let parseRTF = () => {    
    getDownloadedRTF().then( (list) =>{
	for(let l of list){
	    promisifiedExec(util.format('unrtf --html %s', l.fileName))
		.then( (html) => {	    
		    let data = votingHTMLParser(html);
		    for (let k in data){
		    	l[k] = data[k];
		    }
		    return l;
		}).then( (l) => {
		    getSessionById(l.session_id).then( (session) => {
			//iterate over session.votings and merge with l
			let detailsIndex = 0;
			while(detailsIndex < session.details.length){
			    let sd = session.details[detailsIndex];
			    if(sd !== undefined && sd.votings !== undefined){
				let votingIndex = 0;
				while(votingIndex < sd.votings.length){
				    let v = sd.votings[votingIndex];
			    	    //for(let v of sd.votings){
			    	    if(l.link.search(v.link) !== -1){
					l.result =  v.title;
					l.president = session.PRESIDENTE.replace(": Diputado Nacional ","");
					console.log(l._id);
					saveObjects('votings', l);
					detailsIndex = session.details.length;//breaks while
			    		break;
			    	    }
				    votingIndex++;
			    	}
			    }
			    detailsIndex++;
			}
		    });
		}).catch( (error) => {
		    console.log(error);
		});
	}
    });    
};

parseRTF();
//crawlSessions();
