import request from 'request-promise';
import { saveObjects, saveCongressmen, getAllCongressmen } from './db-client';

const baseUri = 'http://datos.congreso.gov.py/opendata/api/data/';


let options  = {
    method: 'GET',
    uri: baseUri,
    json: true
};

let getParlamentarios = () => {
    options.uri= baseUri + 'parlamentario/';
    return request(options)
	.then((body) => {
	    saveObjects('parlamentarios', body);
	    return body;
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
	    saveObjects('proyectos', body);
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

//tramitaciones
let getTramitaciones = (billId) => {
    //bill itself
    options.uri = baseUri + 'proyecto/'+ billId + '/tramitaciones';
    request(options)
	.then((body) => {
	    //save tramitacion as it comes
	    saveObjects('tramitaciones', body);
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

//dictamenes
let getDictamenes = (billId) => {
    //bill itself
    options.uri = baseUri + 'proyecto/' + billId + '/dictamenes';
    request(options)
	.then((body) => {
	    saveObjects('dictamenes', body);
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

//get bills by congressmen
let getProyectosPorParlamentario = (parlamentarioId) => {
    options.uri=baseUri + 'parlamentario/'+ parlamentarioId +'/proyectos';
    let bills;
    request(options)
	.then((body) => {
	    // let historyPromises = [];
	    // let dictaminationPromises = [];
	    saveObjects('parlamentario_proyectos', body);
	    for (let bill of body.proyectos){
		console.log(bill.idProyecto);
		setTimeout(getProyecto(bill.idProyecto), 3000);
//		getTramitaciones(bill.idProyecto);
//		getDictamenes(bill.idProyecto);
	    }
	}).catch( (err) => {
	    console.log('....failed');
	    console.trace(err);
	});
};

// getParlamentarios().then( (parlamentarios) => {
//     for(let p of parlamentarios){
// 	console.log(p.nombres, p.apellidos);
// 	setTimeout(getProyectosPorParlamentario(p.idParlamentario), 1000);
	
//     }
// });


let testTimeOut = () =>{
    let d = new Date();
    console.log(d);
};

let i=0;
while (i< 10){

    setTimeout(testTimeOut(), 5000);
    console.log('---', new Date());
    i++;
}

