
import fs from 'fs';
import request from 'request-promise';

import { promisifiedExec, checkFileExistence, promisifiedWriteFs } from './utils';
import { saveObjects, removeCollection, saveCongressmen, congressmenBills, upsertObject, getBills, 
	 findObjects, getCongressmanById, getCongressmenByPeriod, getUniqueBills } from './mongo-client';
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

let getProyectosParlamentarios = (parlamentarios) => {
    return parlamentarios.reduce( (sequence, p) => {
	return sequence.then( () => {
	    return getProyectosPorParlamentario(p.idParlamentario);
	}).then( (data) => {
	    console.log(data.nombres, data.apellidos, data.proyectos.length);
	    saveObjects('parlamentario_proyectos', data);
	}).catch( (error) => {
	    //save failed request to try afterwards
	    console.log('Failed ', p.idParlamentario, p.nombres, p.apellidos);
	    p.failed = true;
	    saveObjects('parlamentario_proyectos', p);
	});
    }, Promise.resolve());
};

export let getCongressmenData = () => {
    //TODO: clean collection in the db or save only new items
    getParlamentarios().then( (parlamentarios) => {	
	removeCollection('parlamentarios', {});
	saveObjects('parlamentarios', parlamentarios);
    }).then( () => {
	removeCollection('parlamentario_proyectos', {});
	getCongressmenByPeriod('2013-2018').then( (parlamentarios) => {
	    return getProyectosParlamentarios(parlamentarios);
	}).then( () => {
	    findObjects('parlamentario_proyectos', {failed: true}).then( (result) => {
		getProyectosParlamentarios(result);
	    });
	});
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

export let getBillsRelatedData = () => {
    getUniqueBills().then( (bills) => {
	removeCollection('bills').then( () => {
	    console.log('All bills removed...');
	    return bills;
	}).then( (bills) => {
	    bills.reduce( (sequence, bill) => {
		return sequence.then( () => {
		    //download files
		    return getProyecto(bill.idProyecto).then( () => {
			console.log('Proyecto ', bill.idProyecto, ' descargado correctamente.');
		    }).catch( (error) => {
			console.log(error);
		    });
		}).catch( (error) => {
		    console.log(error);
		});
	    }, Promise.resolve());
	}).catch( (error) => {
	    console.log(error);
	});
    }).catch( (error) => {
	console.log(error);
    });
};

let downloadBillFile = (link) => {
    return new Promise( (resolve, reject) => {
	console.log('Downloading: ', link.link);
	let outFile = fileBaseDir + link.name;
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
		    reject(error);
		});
	}else{
	    console.log('File already exists: --->', outFile );
	    resolve(outFile);
	}
    });
};

//download files related to bills
export let downloadBills = (newFiles) => {
    console.log('Will download bills files.');
    let query;
    if (newFiles == true){
	query = {file: {$exists: false} };
    }
    findObjects('bills', query).then( (bills) => {
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
			link.file = file;
			bill.file = link;
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
};
