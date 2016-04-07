
import fs from 'fs';
import request from 'request-promise';

import { promisifiedExec, checkFileExistence, promisifiedWriteFs } from './utils';
import { saveObjects, removeCollection, saveCongressmen, congressmenBills, upsertObject, getBills, 
	 getCongressmanById, getCongressmenByPeriod, getUniqueBills } from './mongo-client';
import { parseBillHtml } from './silpy-htmlbill-parser';

const baseUri = 'http://datos.congreso.gov.py/opendata/api/data/';
const fileBaseDir = '/tmp/parlamentoabierto/bills/'; //__dirname + '/../../bills/';
//dirname = 'download/bills/%s/documents' %(project_id)

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

//dictamenes
let getDictamenes = (billId) => {
    options.uri = baseUri + 'proyecto/' + billId + '/dictamenes';
    console.log('Obteniendo dictamenes: ', options.uri);
    return new Promise( (resolve, reject) => {
	request(options)
	    .then((body) => {
		saveObjects('dictamenes', body);
		resolve(body);
	    }).catch( (err) => {
		console.trace(err);
		reject(err);
	    });
    });
};

//tramitaciones
let getTramitaciones = (billId) => {
    options.uri = baseUri + 'proyecto/'+ billId + '/tramitaciones';
    console.log('Obteniendo tramitaciones: ', options.uri);
    return new Promise( (resolve, reject) => {
	request(options)
	    .then((body) => {
		saveObjects('tramitaciones', body);
		resolve(body);
	}).catch( (err) => {
	    console.trace(err);
	    reject(err);
	});
    });
};

let getAutores = (billId) => {
    options.uri = baseUri + 'proyecto/'+ billId + '/autores';
    console.log('Obteniendo autores: ', options.uri);
    return new Promise( (resolve, reject) => {
	request(options)
	    .then((body) => {
		resolve(body);
	}).catch( (err) => {
	    console.trace(err);
	    reject(err);
	});
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

let getProyecto = (billId) => {
    options.uri = baseUri + 'proyecto/'+ billId;
	return request(options)
	    .then((bill) => {
		return bill;
	    }).then( (bill) => {
		getTramitaciones(billId).then( (tramitaciones) => {
		    return Object.assign({}, bill, tramitaciones);
		}).then( (obj) => {
		    getAutores(billId).then( (autores) => {
			return Object.assign({}, obj, autores);
		    }).then( (obj1) => {
			getDictamenes(billId).then( (dictamenes) => {
			    obj1 = Object.assign({}, obj1, dictamenes);
			    saveObjects('bills', obj1);
			});
		    });
		});
	    }).catch( (err) => {
		console.log('....failed');
		console.trace(err);
	    });
};

let getBillsRelatedData = () => {
    getUniqueBills().then( (bills) => {	
	Object.keys(bills).reduce( (sequence, billId) => {
	    return sequence.then( () => {
		//download files
		return getProyecto(billId).then( () => {
		    console.log('Proyecto ', billId, ' descargado correctamente.');
		}).catch( (error) => {
		    console.log(error);
		});
	    }).catch( (error) => {
		console.log(error);
	    });
	}, Promise.resolve());
    });
};


//base_dir = download/bills/D-1433124/documents/ANTECEDENTE-D-1433124.PDF
let downloadBillFile = (link) => {
    return new Promise( (resolve, reject) => {
	console.log('Downloading: ', link.link);
	let outFile = fileBaseDir  + 'documents/' + link.name;
	//file does not exists, so we create it
	//return promisifiedExec('curl ' + link.link + ' -o ' + output)
	if(!fs.existsSync (outFile)){
	    //TODO: add max buffer size to invocation
	    let maxBufferSize = link.size + link.size*0.30; //30% greater just in case
	    let command = 'curl -o' + outFile + ' ' + link.link;
	    promisifiedExec(command, {maxBuffer: maxBufferSize})
		.then( (output) =>{
		    console.log('File saved to: ', outFile);
		    resolve(outFile);
		}).catch( (error) => {
		    console.log(error);
		});
	}else{
	    console.log('File already exists: --->', outFile );
	    resolve(outFile);
	}
    });
};

//download all bills
export let downloadBills = () => {
    //first get all bill related to all congressmen
    //bills are not repeated, and save them to a new collection
    getUniqueBills().then( (bills) => {
	removeCollection('bills').then( () => {
	    console.log('All bills removed...');
	    saveObjects('bills', bills);
	});
    }).then( () => {
	//then download all related data and files for each bill
	console.log('Will download bills related data and files');
	getBills().then( (bills) => {
	    console.log(bills.length);
	    bills.reduce( (sequence, bill) => {
		return sequence.then( () => {
		    //download files
		    return request(bill.appURL).then( (content) => {
			//download file
			//parseBillHtml(content)[0]; -> ignora antecedentes
			let link = parseBillHtml(content)[0];
			let base = link.link.split(';')[0];
			link.link = base + link.link.substring(link.link.indexOf('?'));
			return downloadBillFile(link).then( (file) => {
			    bill.file = file;
			    console.log(bill);
			    upsertObject('bills', bill);
			});
		    }).catch( (error) => {
			console.log(error);
		    });
		}).catch( (error) => {
		    console.log(error);
		});
	    }, Promise.resolve());
	});
    });
};
