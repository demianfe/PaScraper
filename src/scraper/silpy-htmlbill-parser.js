import cheerio from 'cheerio';
import { promisifiedReadFs } from './utils';

let file = '/Data/devel/projects/tedic/src/PaScrapper/resources/proyecto_104008.html';
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
	    	link = link.substring(link.indexOf('http'), link.length -1);
		results.push({name: text[0],
			      link: link});
	    }
	}
    });
    return results;
};
