'use strict';
/* author: demian@tedic.org */

import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { trimString, promisifiedFs, rtfToHtml } from './utils';

const baseDir = '/Data/devel/projects/tedic/src/PaScrapper/resources/';

//first transform from rtf to html
//then parse thehtml buffer

let votingHTMLParser = (data) => {
    /* parses the html result of the conversion rtf -> html */
    data = iconv.decode(data, 'utf8');
    let $ = cheerio.load(data);
    let trList = $('table tr');
    let voting = {};
    voting.yes = [];
    voting.no = [];
    voting.abstention = [];
    voting.excluded = []; //??
    let keys =  Object.keys(trList);
    
    const sections = ['Nombre Propuesta:', 'Sí ( Votos:', 'No ( Votos:',
		      'Abstención (', 'No-Votan ( Total:'];
    let currentSection = '';
    voting.date = trimString($(trList[0]).text());
    
    for (let key of keys){
	let tdList = $('td', trList[key]);
	//1st division: Nombre Propuesta:
	//2nd division: Sí ( Votos: 66 )
	//3rd division: No ( Votos: 0 )
	//4th division: Abstención ( Votos: 0 )
	//5th division: No-Votan ( Total: 8 )
	//columns 1, 3 and 5 contain text
	let firstText = $(tdList[0]).text();
	//TODO:improve algorithm?
	if(firstText.indexOf(sections[0]) > -1){
	    //the next row column 1 contains the value
	    currentSection = sections[0];
	}else if(firstText.indexOf(sections[1]) > -1){
	    currentSection = sections[1];
	}else if(firstText.indexOf(sections[2]) > -1){
	    currentSection = sections[2];
	}else if(firstText.indexOf(sections[3]) > -1){
	    currentSection = sections[3];
	}else if(firstText.indexOf(sections[4]) > -1){
	    currentSection = sections[4];
	}
	if(currentSection === sections[1]){
	    if($(tdList[1]).text() !== ''){
		voting.yes.push(trimString($(tdList[1]).text()));
		voting.yes.push(trimString($(tdList[3]).text()));
		voting.yes.push(trimString($(tdList[5]).text()));
	    }
	}else if(currentSection === sections[2]){
	    if($(tdList[1]).text() !== ''){
		voting.no.push(trimString($(tdList[1]).text()));
		voting.no.push(trimString($(tdList[3]).text()));
		voting.no.push(trimString($(tdList[5]).text()));
	    }
	}else if(currentSection === sections[3]){
	    if($(tdList[1]).text() !== ''){
		voting.abstention.push(trimString($(tdList[1]).text()));
		voting.abstention.push(trimString($(tdList[3]).text()));
		voting.abstentionpush(trimString($(tdList[5]).text()));
	    }
	}else if(currentSection === sections[4]){
	    if($(tdList[1]).text() !== ''){
		voting.excluded.push(trimString($(tdList[1]).text()));
		voting.excluded.push(trimString($(tdList[3]).text()));
		voting.excluded.push(trimString($(tdList[5]).text()));
	    }
	}
    }
    console.log(voting);
    return voting;
};

let votingParser = () => {
    let promises = rtfToHtml(baseDir + 'rtf/');
    
    Promise.all(promises).then( (values) => {
	for(let data of values){
	    votingHTMLParser(data);
	}
    }).catch( (error) => {
	console.trace(error);
    });
};


votingParser();
