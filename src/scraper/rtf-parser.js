'use strict';
/* author: demian@tedic.org */
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { trimString, promisifiedFs, rtfToHtml } from './utils';

const baseDir = '/Data/devel/projects/tedic/src/PaScrapper/resources/';

const sections = ['Nombre Propuesta:', 'Sí ( Voto', 'No ( Voto',
		  'Abstención (', 'No-Vota', 'Page 1 of 1'];

//obj: the object the list is beeing attached to
//objList: the list the items are pushed to 
//values: the items (tdList)
let addValuesToList = (obj, objList, values) => {
    let $ = cheerio.load(values);
    //console.log($);
    let tdList = $('td');    
    let index = 0;
    while (index < tdList.length){
	let text = trimString($(tdList[index]).text());
	let add = true;
	for(let section of sections){
	    //exclude section strings
	    if (text.indexOf(section) != -1){
		add = false;
	    }
	}	
	if (add && text !== ''){
	    obj[objList].push(text);
	}
	index++;
    }
    return obj;
};

//TODO: if nothing found slide one columnt to the right
export let votingHTMLParser = (data) => {
    /* parses the html result of the conversion rtf -> html */
    data = iconv.decode(data, 'utf8');    
    let $ = cheerio.load(data);
    let trList = $('tr'); //works for most cases
    let voting = {};
    voting.yes = [];
    voting.no = [];
    voting.abstention = [];
    voting.excluded = []; //??
    let keys =  Object.keys(trList);    
    let currentSection = '';
    voting.date = trimString($(trList[0]).text());
    if(voting.date.indexOf('\n') != -1){
	//date is divided in 3 lines
	voting.date = voting.date.split('\n')[2];
    }else if(voting.date.toUpperCase().indexOf('REGISTRO') != -1 ||
	     voting.date.toUpperCase().indexOf('REGITRO') != -1 ||
	     voting.date === ''){
	voting.date = trimString($(trList[1]).text());
    }
    if(voting.date !== undefined && voting.date !== ""){
	voting.hour = voting.date.split(" ")[1];
	voting.date = voting.date.split(" ")[0];
    }
    for (let key of keys){
	let tdList = $('td', trList[key]);
	//vertical division of document sections
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
	if(currentSection === sections[0]){
	    if(trimString($(tdList[1]).text()) !== ''){
		voting.subject = trimString($(tdList[1]).text());
	    }
	}else if(currentSection === sections[1]){
	    voting = addValuesToList(voting, 'yes', trList[key]);
	}else if(currentSection === sections[2]){
	    voting = addValuesToList(voting, 'no', trList[key]);
	}else if(currentSection === sections[3]){
	    voting = addValuesToList(voting, 'abstention', trList[key]);
	}else if(currentSection === sections[4]){
	    voting = addValuesToList(voting, 'excluded', trList[key]);
	}
    }
    return voting;
};
