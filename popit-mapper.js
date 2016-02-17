import request from 'request-promise';
import crypto from 'crypto';
import { getCongressmenByPeriod } from './db-client';

let baseUrl = 'http://parlamento.popit.parlamentoabierto.org.py:8000/api/v0.1';

const headers = {'Apikey': '99f5af4b78f75c222d643dab10c3eb96777a2be9',
		'Content-Type': 'application/json'};

let options = {
    headers: headers,
    json: true
};

let executeRequest = (options) => {
    return request(options)
	.then((body) => {
	    return body;
    }).catch( (err) => {
	console.log('....failed');
	//console.trace(err);
	throw err;
    });
};

//genertic call to create entities on popit
let createObject = (object, uri) => {
    options.uri = uri;
    options.body = object;
    options.method = 'POST';
    executeRequest(options).then( (result) => {
	console.log(result);
    });
};

let createMembership = (data) => {
    let organization_id = data['organization_id'];
    let person_id = data['person_id'];
    let membership_id = organization_id + person_id;
    //r = requests.get(url_string + '/memberships/' + membership_id);
    if (r.status_code == 404){
	data['id'] = membership_id;
	data['organization_id'] = organization_id;
	//TODO: add createObject call
	//let mem = api.memberships.post(data);
    }else{
        console.log("ya existe membresia");
    }
};

let createOrganization = (name, classification) => {
    let orgId = crypto.createHmac('sha1', '').update(name).digest('hex');
    //TODO: get from baseUrl + /origanization to check for existence
    //if not creat, if it does just link
    let organization = {};
    organization.id = orgId;
    organization.name = name;
    organization.classification = classification;//'Chamber';
    //TODO: add createObject call
};

let createCommittees = () => {
    //TODO: crear comisiones
};

getCongressmenByPeriod('2013-2018').then( (congressmen) => {
    for (let c of congressmen){
	let person = {};
	// _id: 56c3bbd45a67474b3de71a77,
	person.id= c.idParlamentario;//: 100260
	person.name = c.nombres + ' ' + c.apellidos;
	person.img = c.fotoURL;//: 'http://sil2py.senado.gov.py/images/100260.jpg',
	//appURL: 'http://sil2py.senado.gov.py/formulario/verProyectosParlamentario.pmf?q=verProyectosParlamentario/100260',
	person.contact_details=[{type: 'email',
				 label: 'Correo Electronico',
				 value: c.emailParlamentario},
				{type: 'phone',
				 label: 'Telefono',
				 value: c.telefonoParlamentario}];
	
	//obtener sus organizaciones(partido, camara) desde la base de datos
	//crear organizaciones y membresias
	//
	//TODO: add createObject call
    }
});

let getPopitPerson = (id) => {
    options.uri = baseUrl + '/persons/' + id;
    options.method = 'GET';
    return executeRequest(options).then( (data) => {
	return(data);
    });
};

let getPopitOrganization = (id) => {
    //TODO:
};

let getPopitMembership = (id) => {
    //TODO:
};


//######################
//##### Test Code ######
//######################
getPopitPerson(1000911).then((data) => {
    console.log(data);    
}).catch( (error) => {
    if(error.statusCode && error.statusCode == 404){
	console.log('la persona ya existe');
    }
});

//createObject({name: 'The New Test Organization'}, baseUrl + '/organizations');
