import cheerio from 'cheerio';
import { trimString } from './utils';

let emailIcon = 'email.png';

export let parseBillHtml = (content) => {
    let results = [];
    let $ = cheerio.load(content);
    let element  = $('a img');
    element.each( (index, item) => {
	if($(item).attr('src').indexOf(emailIcon) !== -1){
	    let button = $($(item).parent()[0]).siblings('button');
	    let text = $(button.parent()[0]).text();
	    let link = button.attr('onclick');
	    text = text.split('\n');
	    if(link !== undefined){
		let s = trimString(text[1]).replace(',','.');
		s = Number.parseFloat(trimString(s.substring(1, s.indexOf("MB"))));		
		s = s*1024*1024;//size is not accuratex
	    	link = link.substring(link.indexOf('http'), link.length -1);
		results.push({name: text[0],
			      size: s,
			      link: link});
	    }
	}
    });
    return results;
};

