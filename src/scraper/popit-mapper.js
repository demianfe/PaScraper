import request from 'request-promise';
import crypto from 'crypto';
import { findObjects, getCongressmenByPeriod } from './mongo-client';
import { popitBaseUrl, PopitApikey } from './config';

const headers = {'Apikey': PopitApikey,
		 'Content-Type': 'application/json'};

let options = {
    headers: headers,
    json: true
};

//genertic call to create entities on popit
let createObject = (object, uri) => {
    return new Promise( (resolve, reject) => {
	options.uri = uri;
	options.body = object;
	options.method = 'POST';
	request(options).then( (result) => {
	    resolve(result);
	}).catch( (error) => {
	    reject(error);
	});
    });
};

// http://parlamento.popit.parlamentoabierto.org.py:8000/api/v0.1/persons
// http://parlamento.popit.parlamentoabierto.org.py:8000/api/v0.1/organizations
// http://parlamento.popit.parlamentoabierto.org.py:8000/api/v0.1/memberships
// http://parlamento.popit.parlamentoabierto.org.py:8000/api/v0.1/posts

let getPopitPerson = (id) => {
    options.uri = popitBaseUrl + '/persons/' + id;
    options.method = 'GET';
    return request(options).then( (data) => {
	return(data);
    });
};

let getPopitOrganization = (id) => {
    return request({method: "GET", uri: popitBaseUrl + "/organizations"});   
};

let createMembership = (organizationId, memberId) => {
    let membershipId = String(organizationId) + String(memberId);
    //r = requests.get(url_string + '/memberships/' + membership_id);
    let data = {};
    let localOptions = {method: "GET",
			uri: popitBaseUrl + "/memberships/" + String(membershipId),
			json: true};
    localOptions.headers = headers;
    return new Promise( (resolve, reject) => {
	return request(localOptions).then((response) => {
	    if (response.total !== 0){
		console.log("ya existe membresia");
		resolve(response.result);
	    }
	}).catch( (error) => {
	    if(error.statusCode == 404){
		data.id = membershipId;
		data.organization_id = organizationId;
		data.person_id = String(memberId);
		//TODO: add createObject call
		//let mem = api.memberships.post(data);
		
		createObject(data, popitBaseUrl + "/memberships")
		    .then( (result) => {
			resolve(result);
		    }).catch( (error) => {
			console.log(data);
			console.log(error.statusCode, error.error);
			reject(error);
		    });
	    }
	});
    });
};

/* 
 creates an organization if it does not already exists
 */
let createOrganization = (id, name, classification, description, email, url) => {
    return new Promise( (resolve, reject) => {
	request({method: "GET", uri: popitBaseUrl + "/organizations/" + String(id), json: true})
	    .then( (response) => {
		if(response.total !== 0){
		    console.log("Ya existe la organizacion con id", id);
		    resolve(response.result);
		}
	    }).catch ( (error) => {
		if(error.statusCode == 404){
		    let organization = {};
		    organization.id = String(id);
		    if(name !==undefined)
			organization.name = name;
		    if(classification !==undefined)
			organization.classification = classification;//'Chamber';
		    if(description !==undefined)
			organization.description = description;
		    //apparently contact_details is not supported by popit's popolo implementation
		    //if(email !==undefined) organization.contact_details = {type:"email", value: email}; 
		    if(url !==undefined) organization.links = [{url: url}];
		    console.log("creando", classification, "con id y nombre",id, name);
		    createObject(organization, popitBaseUrl + "/organizations")
			.then( (result) => {
			    resolve(organization);
			}).catch( (error) => {
			    console.log(error.statusCode, error.error);
			    reject(error);
			});
		}
	    });	     
    });
};


let postMembersAndMemberships = (congresista) =>{
    return findObjects('comisiones',
		       {"miembros.idParlamentario":
			congresista.idParlamentario})
	.then( (comisiones) => {
	    let partyId = crypto.createHmac('sha1', '').update(congresista.partidoPolitico).digest('hex');
	    let party =  {id: partyId,
			  name: congresista.partidoPolitico};
	    //createParty
	    console.log("Creando partido politico.");
	    createOrganization(partyId,
			       congresista.partidoPolitico,
			       "Partido")
		.then( (popitOrganization) => {
		    createMembership(popitOrganization.id, congresista.idParlamentario);
		});
	    return comisiones.reduce( (sequence, comision) => {
		createOrganization(String(comision.idComision),
				   comision.nombreComision,
				   "Comision",
				   comision.competenciaComision,
				   comision.email,
				   comision.appURL)
		    .then( (popitOrganization) => {
			createMembership(popitOrganization.id, congresista.idParlamentario);
		    });
	    });
	}, Promise.resolve());
};

export let popitCreateAll = () => {
    getCongressmenByPeriod('2013-2018').then( (congressmen) => {
	congressmen.reduce( (sequence, congressman) => {    
	    return sequence.then( () => {
		let person = {};
		// _id: 56c3bbd45a67474b3de71a77,
		person.id = String(congressman.idParlamentario);//: 100260
		person.name = congressman.nombres + ' ' + congressman.apellidos;
		person.img = congressman.fotoURL;//: 'http://sil2py.senado.gov.py/images/100260.jpg',
		//appURL: 'http://sil2py.senado.gov.py/formulario/verProyectosParlamentario.pmf?q=verProyectosParlamentario/100260',
		person.contact_details=[{type: 'email',
					 label: 'Correo Electronico',
					 value: congressman.emailParlamentario},
					{type: 'phone',
					 label: 'Telefono',
					 value: congressman.telefonoParlamentario}];
		console.log("Creando congresista", person.id, person.name);
		//postPerson(person)
		return createObject(person, popitBaseUrl + '/persons').then( (result) =>{
		    console.log(result);
		    return postMembersAndMemberships(congressman);
		}).catch( (error) =>{
		    console.log(error);
		});
	    });
	}, Promise.resolve());
    });
};


//######################
//##### Test Code ######
//######################
popitCreateAll();
