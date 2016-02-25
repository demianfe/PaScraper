import request from 'request-promise';
import { saveObjects, removeCollection, saveCongressmen } from './db-client';
import { getCongressmanById, getCongressmenByPeriod, getUniqueBills } from './db-client';
import sleep from 'sleep';

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
let getProyecto = (billId) => {
    //bill itself
    options.uri = baseUri + 'proyecto/'+ billId;
    request(options)
	.then((body) => {
	    //save tramitacion as it comes
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

//dictamenes
let getDictamenes = (billId) => {
    options.uri = baseUri + 'proyecto/' + billId + '/dictamenes';
    request(options)
	.then((body) => {
	    //console.log('guardando dictamen ' + );
	    console.log(body);
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

getUniqueBills().then( (ids) => {
    let indx = 0;
    console.log('Total ids found: ', ids.length);
    while(indx < 100){
	let subindx = 0;
	while(subindx < 10){
	    let id = ids[indx];
	    getDictamenes(id);
	    console.log('we are in the');
	    subindx++;
	    indx++;
	}
	console.log(indx);
    }
});


