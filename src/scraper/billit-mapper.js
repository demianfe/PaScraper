'use strict';
import request from 'request-promise';
import { getBills, countUniqueBills, getUniqueBills } from './mongo-client'

;
//const host = 'http://localhost:8002';
const host = 'http://parlamentoabierto.org.py:8002';
const secret_token = '75cc973db60d3e07beaa1630c4cb37ded228e5bb71853be068a573b1a2ee385379111f9b12847b285a7e2c2b2f918b2902f4edb04046319cf41148a642fa53d3';


let headers = {"Content-Type": "application/json",
               "X-CSRF-Token": secret_token};

let options  = {
    method: 'GET',
    uri: host,
    headers: headers,
    json: true
};

let getChamber = (chamber) => {
    if (chamber === "CAMARA DE DIPUTADOS") return "C. Diputados";
    else if (chamber === "CAMARA DE SENADORES") return "Senado";
    return chamber;
};

let createBillObject = (p) => {
    let bill = {};
    bill.silpy_id = p.idProyecto;
    //bill.uuid = p.idProyecto;
    if ('acapite' in p){
	bill.title = p['acapite'];
    }if ('fechaIngresoExpediente' in p){
	bill.creation_date = p['fechaIngresoExpediente'];
    }if ('origenProyecto' in p){
	bill.initial_chamber = getChamber(p.origenProyecto);
	bill.source = p.iniciativa;
    }if ('tipoProyecto' in p){
	bill.abstract = p.tipoProyecto;
    }if ('urgencia' in p){
	bill.urgent = p.urgencia;
    }if ('descripcionEtapa' in p){
	bill.stage = p.descripcionEtapa;
    }if ('descripcionSubEtapa' in p){
	bill.sub_stage = p.descripcionSubEtapa;
    }if ('estadoProyecto' in p){
	bill.status = p.estadoProyecto;
    }
    bill.authors = [];
    if ('autores' in p){
	console.log();
	for (let author of p.autores.autor){
	    bill.authors.push(author.idParlamentario + ':'
			      + author.nombres + ' ' + author.apellidos);
	}
    }
    //tramitaciones 
    bill.tramitaciones = [];    
    if ('tramitaciones' in p){
	for (let tramitacion of p.tramitaciones.tramite){
	    let new_tramitacion = {};
	    new_tramitacion.session = tramitacion.numeroSesion;
	    new_tramitacion.date = tramitacion.fechaTramite;
	    new_tramitacion.chamber = getChamber(tramitacion.camaraTramite);
	    new_tramitacion.stage = tramitacion.descripcionEtapa;
	    new_tramitacion.timeline_status = tramitacion.resultadoTramite;      
	    bill.tramitaciones.push(new_tramitacion);
	}
    }
    //TODO: documents
    bill.documents = [];
    if ('file' in p){
        document = {};
        //document.type = doc['type']; // :type => String
        // document.number#, :type => String
        // document.step = doc['']#, :type => String
        // document.stage = doc['']#, :type => String
        // document.chamber = doc['']#, :type => String
        document.link = p.file;//#, :type => String
	bill.documents.push(document);
    }
    
    // //TODO: Directives
    // bill.directives = [];
    // if ('directives' in p){
    //     if (p['directives']){
    //         for (let d of p['directives']){
    //             let directive = {};
    //             if ('date' in d){
    //                 directive.date = d['date'];//#, :type => DateTime
    //             }if ('result' in d){
    //                 directive.step = d['result'];// #, :type => String
    //                 //directive.stage #, :type => String ?
    //                 //directive.link #, :type => String ?
    // 		}	 
    //             bill.directives.append(directive.__dict__);
    // 	    }
    // 	}
    // }
    return bill;
};

let  updateOrCreate = () => {
    //get all projects from "updated_bills" collection
    //verify if the collection exists already
    //if does not make post request
    //otherwise make put request
    // updated_bills = mdb.updated_bills.find_one()
    // last_update = updated_bills['last_update']
    
    // #print updated_bills[last_update]['bills'][1]
    // for b in updated_bills[last_update]['bills']:
    //     bill_id= b['info']['file']
    //     bill = create_bill_object(b)
    //     r = requests.get(host + '/bills/' + bill_id)
    //     if r.status_code == 200:
    //         print "Updating Bill %s" %(bill_id)
    //         r = requests.put(host + '/bills', data=json.dumps(bill.__dict__))
    //     elif r.status_code == 404:
    //         print "Creating new Bill %s" %(bill_id)
    //         r = requests.post(host + '/bills', data=json.dumps(bill.__dict__))
};

let postProjects = (bill) =>{    
    console.log("loading bill with uuid=", bill.idProyecto);
    let billitObj = createBillObject(bill);
    options.uri = host + '/bills';
    options.body = billitObj;
    return request(options).then( (response) => {
	console.log('Creado exitosamente ');
	//console.log(response);
    }).catch( (error ) =>{
	console.log('Error !');
	console.trace(error);
    });
    //r = requests.post(host + '/bills', data=json.dumps(bill.__dict__))
    //print "------------------------------------------------------------------------------  "
    //print r.content
};

let mapBillit = () => {
    let offset = 50;
    let start = 0;
    let end = offset;
    countUniqueBills().then( (total) => {
	console.log('total', total);
	console.log('about to call getBills');
	let count = 0;
	getBills().then( (bills) => {
	    bills.reduce( (sequence, bill) => {
		return sequence.then( () => {
		    console.log("-------------------------");
		    count +=1;
		    console.log('count', count);
		    console.log("-------------------------");
		    return postProjects(bill);
		}).catch( (err) => {
		    console.trace(err);
		});
	    }, Promise.resolve());
	});
    });
};

//helper function to change
//bill-it uid with the id used in silpy
//expedienteCamara is currently used as uid
let updateBillIds = () => {
    getBills().then( (bills) => {
	for(let bill of bills){
	    
	}
	// bills.reduce( (sequence, bill) => {
	//     return sequence.then( () => {
		
	//     }).catch( (err) => {
	// 	console.trace(err);
	//     });
	// }, Promise.resolve());
    });
};
