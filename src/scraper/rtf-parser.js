'use strict';
/* author: demian@tedic.org */
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import { trimString } from './utils';

// index 1 and 2 corresponds to the firs set of data: the YES voters
// the difference is the accent
const sections = ['Nombre Propuesta:', 'Sí ( Voto', 'Si ( Voto','No ( Voto',
		  'Abstención (', 'Abstencion (', 'No-Vota', 'Page 1 of 1'];

//obj: the object the list is beeing attached to
//objList: the list the items are pushed to 
//values: the items (tdList) of the list
//TODO: handle asynchronicity
let addValuesToList = (obj, objList, values) => {
//    return new Promise ( (resolve, reject) => {
	let $ = cheerio.load(values);
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
	//resolve(obj);
	return obj;
  //  });
};

let parseHTML = (data, dataIndex) => {
    /* parses the html result of the conversion rtf -> html */
    data = iconv.decode(data, 'utf8');
    let $ = cheerio.load(data);
    let trList = $('tr'); //works for most cases
    let voting = {};
    let subject;
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
	let firstText = $(tdList[dataIndex]).text();
	
	if(firstText.indexOf(sections[0]) > -1){
	    //the next row column 1 contains the value
	    currentSection = sections[0];
	}else if(firstText.indexOf(sections[1]) > -1 ||
		 firstText.indexOf(sections[2]) > -1){
	    currentSection = sections[1];
	}else if(firstText.indexOf(sections[3]) > -1){
	    currentSection = sections[3];
	}else if(firstText.indexOf(sections[4]) > -1 ||
		firstText.indexOf(sections[5]) > -1){
	    currentSection = sections[4];
	}else if(firstText.indexOf(sections[6]) > -1){
	    currentSection = sections[6];
	}
	//text extraction part
	if(currentSection === sections[0]){
	    //TODO: avoid the other sections
	    let text = trimString($(tdList[1]).text());
	    if(text !== ''){
		for(let section of sections){
		    //exclude section strings
		    if (subject == undefined && text.indexOf(section) == -1){
			subject = text;
			//voting.subject = subject;
		    }
		}
	    }
	}else if(currentSection === sections[1]){
	    //let text = trimString($(tdList[key]).text());
	    //voting = addValuesToList(voting, 'yes', trList[key]);
	    voting = addValuesToList(voting, 'yes', trList[key]);
	}else if(currentSection === sections[3]){
	    voting = addValuesToList(voting, 'no', trList[key]);
	}else if(currentSection === sections[4]){
	    voting = addValuesToList(voting, 'abstention', trList[key]);
	}else if(currentSection === sections[6]){
	    voting = addValuesToList(voting, 'excluded', trList[key]);
	}
    }
    voting.subject = subject;
    return voting;
};
//TODO: if nothing found slide one columnt to the right
export let votingHTMLParser = (data) => {
    //index where data should be found
    //if not found normaly is the next row
    let dataIndex = 0;
    let voting = parseHTML(data, dataIndex);
    let subject;
    if (voting.subject !== undefined){
	subject = voting.subject;
    }
    
    //if all values are 0 there's someting wrong
    //old rtf files sometimes contain data one on the next column
    if (voting.yes.length == 0 &&
	voting.no.length == 0 &&
	voting.abstention.length == 0 &&
	voting.excluded.length == 0){
	voting = parseHTML(data, dataIndex + 1);
    }
    voting.subject = subject;
    return voting;
};
