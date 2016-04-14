import cheerio from 'cheerio';
import { trimString } from './utils';

let emailIcon = 'email.png';

export let parseBillHtml = (content) => {
    let results = [];
    let $ = cheerio.load(content);
    // let table  = $('table .ui-panelgrid.ui-widget');
    // let trList = $('tr', table);
    // let detail = {};
    // detail.expediente = $(trList[0]).text().split(':')[1].split('\n')[0];
    // detail.fechaIngreso = $(trList[0]).text().split(':')[2];
    // detail.tipoProyecto = $(trList[1]).text().split(':')[1].split('\n')[0];
    // detail.iniciativa = $(trList[1]).text().split(':')[2];
    // detail.origen = $(trList[2]).text().split(':')[1].split('\n')[0];
    // detail.urgencia = $(trList[2]).text().split(':')[2];
    
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
		s = s*1024*1024;//size is not accurate
	    	link = link.substring(link.indexOf('http'), link.length -1);
		results.push({name: text[0],
			      size: s,
			      link: link,
			      type: text[0].split("-")[0]});
	    }
	}
    });
    //detail.results = results;
    return results;
};

