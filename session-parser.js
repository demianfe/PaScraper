'use strict';

import cheerio from 'cheerio';
import { trimString } from './utils';

export let parseSession = (data) => {
    let $ = cheerio.load(data);
    let sessionData = {};
    sessionData.details = [];
    let trList = $('table.MsoTableGrid tr');
    //there are two td that have background '#CCCCCC'
    //they divide the table sections
    let firstDivision = false;
    let seccondDivision = false;
    //rows that span and should be ignored
    let skippedRows = [];
    let keys = Object.keys(trList);
    //remove last two keys, they are footer
    keys.splice(keys.length - 7);
    for (let key of keys){
	let element = trList[key];
	let spanList = $('td span', element);
	let tdList = $('td', element);
	let background = '';
	try{
	    //not sure yet how to avoid this exception
	    //[TypeError: Cannot read property 'attribs' of undefined]
	    background = $(tdList).css('background');
	}catch(e){
	    background = undefined;
	    console.error(e);
	}
	if(background !== undefined && background === '#CCCCCC'){
	    if (firstDivision){
		seccondDivision = true;
	    }else{
		firstDivision = true;
	    }
	}
	if(!firstDivision && !seccondDivision){
	    //header of the document
	    let k  = trimString($(spanList[0]).text());
	    let v = trimString($(spanList[2]).text());
	    if (k !== '' && v !== ''){
		sessionData[k] = v;
	    }
	}else if(firstDivision && !seccondDivision){
	    //TODO: skip or remove header
	    //rename this section?
	    //TODO: extract votings
	    sessionData.details.push({hour: trimString($(spanList[0]).text()),
				     activities: trimString($(spanList[1]).text())});
	}else{
	    //table structure:
	    //sessionDetail = {
	    // hour:<hh:mm>,
	    // order: <String>,
	    // title:{<String>: <a href link>},
	    // votings: [{<String>: <a href link>}]
	    // result: <String>
	    //}
	    //some some tr/td span into 2 or more rows
	    let hour = trimString($(tdList[0]).text());
	    if (skippedRows.indexOf(parseInt(key)) === -1){
		let sessionDetail = {};
		sessionDetail.title = {};
		sessionDetail.votings = [];
		sessionDetail.hour = hour;
		sessionDetail.order = trimString($(tdList[1]).text());
		sessionDetail.subject = {title: trimString($(tdList[2]).text()),
					link: $('a', tdList[2]).attr('href')};
		sessionDetail.audio = $('a', tdList[3]).attr('href');
		//voting
		let voting = {};
		let votingTilte = '';
		votingTilte = trimString($(tdList[4]).text());
		voting[votingTilte] = $('a', tdList[4]).attr('href');
		sessionDetail.votings.push(voting);
		let rowspan = $(tdList[0]).attr('rowspan');
		if (rowspan !== undefined ){
		    // if 'rowspan' attribute found, next row also contains
		    // a file for the same order
		    // at this moment only 4th column is a multirow column
		    skippedRows = Array.from(new Array(parseInt(rowspan) - 1), (x, i) => i + parseInt(key)+1);
		    //siblings() returns a list of elements without the one that is calls the function
		    let lastRow = parseInt(key) + parseInt(rowspan) - 1;
		    let currentRow = key;
		    while (currentRow < lastRow){
			let nextRow = $(element).siblings()[currentRow];
			votingTilte = trimString($(nextRow).text());
			voting[votingTilte] = $('a', nextRow).attr('href');
			sessionDetail.votings.push(voting);
			currentRow++;
		    }
		}
		sessionDetail.index = key;
		sessionData.details.push(sessionDetail);
	    }
	}
    }
    return sessionData;
};
