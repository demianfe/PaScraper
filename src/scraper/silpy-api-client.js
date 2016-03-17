import request from 'request-promise';

import { promisifiedExec, checkFileExistence, promisifiedWriteFs } from './utils';
import { saveObjects, removeCollection, saveCongressmen, congressmenBills,
	 getCongressmanById, getCongressmenByPeriod, getUniqueBills } from './mongo-client';
import { parseBillHtml } from './silpy-htmlbill-parser';

const baseUri = 'http://datos.congreso.gov.py/opendata/api/data/';

let options  = {
    method: 'GET',
    uri: baseUri,
    json: true
};

let getParlamentarios = () => {
    options.uri= baseUri + 'parlamentario/';
    return request(options)
	.then((parlamentarios) => {
	    return parlamentarios;
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

//proyecto de ley
let getProyecto = (args) => {
    //bill itself
    options.uri = baseUri + 'proyecto/'+ args.billId;
    request(options)
	.then((body) => {
	    console.log('guardando proyecto ');
	    if(body.dictamenes != null );{
		saveObjects('proyectos', body);
	    }
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

//get bills by congressmen
let getProyectosPorParlamentario = (parlamentarioId) => {
    options.uri = baseUri + 'parlamentario/'+ parlamentarioId +'/proyectos';
    return request(options)
	.then((body) => {
	    return body;
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

let updateCongressmen = () => {
    getParlamentarios().then( (parlamentarios) => {
    console.log('Total parlamentarios obtenidos: ' + parlamentarios.length);
    removeCollection('parlamentarios', {});
    saveObjects('parlamentarios', parlamentarios);
    });    
};

let updateCongressmenBills = () => {
    //TODO: clean collection in the db or save only new items
    getCongressmenByPeriod('2013-2018').then( (parlamentarios) => {
	return parlamentarios.reduce( (sequence, p) => {
	    return sequence.then( () => {
		return getProyectosPorParlamentario(p.idParlamentario);
	    }).then( (data) => {
		console.log(data.nombres, data.apellidos, data.proyectos.length);
		saveObjects('parlamentario_proyectos', data);
	    });
	}, Promise.resolve());
    });
};


let downloadBillFile = (link) => {
    return new Promise( (resolve, reject) => {
	console.log('Downloading: ', link.link);
	let output = __dirname + '/../../bills/' + link.name;
	return checkFileExistence(output).then( () => {
	    console.log('File already exists: ', output );
	}).catch( (error) => {
	    //file does not exists, so we create it
	    //return promisifiedExec('curl ' + link.link + ' -o ' + output)
	    request({url: link.link, encoding: 'binary'})
		.then( (data) => {
		    promisifiedWriteFs(output, data).then( () => {
			link.file = output;
			resolve(link);
		    });
		}).catch( (error) => {
		    console.log(error);
		});
	});
    });
};
//download all bills
let downloadBills = () => {
    congressmenBills().then( (results) => {
	results.reduce ( (sequence, congressman) => {
	    return sequence.then( () => {
		return congressman.proyectos.reduce( (sequence1, bill) => {
		    return sequence1.then( () => {		    
			return request(bill.appURL).then( (content) => {
			    //download file
			    //parseBillHtml(content)[0]; -> ignora antecedentes
			    return downloadBillFile(parseBillHtml(content)[0]).then( (link) => {
				//get project from silpy-api
				return getProyecto({billId: bill.idProyecto,
						    link: link.link,
						    file: link.file});
				
			    });
			});
		    });
		}, Promise.resolve());
	    }).catch( (error) =>{
		console.trace(error);
	    });
	}, Promise.resolve());
    }).catch( (error) =>{
	console.trace(error);
    });
};


//dictamenes
let getDictamenes = (billId) => {
    options.uri = baseUri + 'proyecto/' + billId + '/dictamenes';
    return request(options)
	.then((body) => {
	    //console.log('guardando dictamen ' + );
	    console.log('Guardando dictamen');
	    saveObjects('dictamenes', body);
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

//tramitaciones
let getTramitaciones = (billId) => {
    //bill itself
    options.uri = baseUri + 'proyecto/'+ billId + '/tramitaciones';
    return request(options)
	.then((body) => {
	    //save tramitacion as it comes
	    console.log('guardando tramitacion ');
	    saveObjects('tramitaciones', body);
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

let getBillsRelatedData = () => {
    getUniqueBills().then( (bills) => {
	let indx = 0;
	Object.values(bills).reduce( (sequence, bill) => {
	    return sequence.then( () => {
		//download files
		return getDictamenes(bill.idProyecto).then( () => {
		    return getTramitaciones(bill.idProyecto);
		});
	    });
	}, Promise.resolve());
    });
};

