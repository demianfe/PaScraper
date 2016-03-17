/*
 author: Demian Florentin<demian@tedic.org>
*/

import Sequelize from 'sequelize';
import request from 'request-promise';
import { getVotings, getDiputados,
	 getSessionsWithVotings, getSessionVotings } from './mongo-client';

/**
 sequelize mysql db definition and initialization

**/
let sequelize = new Sequelize('votacionespa', 'carga', '123456', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
	max: 5,
	min: 0,
	idle: 10000
    }
});

let BloquesDiputados = sequelize.import(__dirname + "/model/bloques_diputados");
let Diputados = sequelize.import(__dirname + "/model/diputados");
let AsuntosDiputados = sequelize.import(__dirname + "/model/asuntos_diputados.js");
let VotacionesDiputados = sequelize.import(__dirname + "/model/votaciones_diputados.js");

/* elasticsearch query to find best match to the name we have, it does not always works */
let elasticSearchURL =  'http://localhost:9200/popitdev_parlamento/_search?';
let queryData = {"query": {"match": {"name": ""}}};

let options = {
    method: 'XPOST',
    uri: elasticSearchURL,
    body: queryData,
    json: true};

//TODO handle low scoring
let findBestMatch = (person) => {
    return new Promise( (resolve, reject) => {
	queryData.query.match.name = person;
	options.body = queryData;
	return request(options).then( (response) => {
	    if(response.hits !== undefined && response.hits.hits !== undefined
	      && response.hits.hits.length > 0 ){
		resolve({id: response.hits.hits[0]._id,
			 name: response.hits.hits[0]._source.name});
	      }else{
		  console.log('No match found for ', person);
		  reject();
	      }
	});
    });
};

//TODO: data cleaning
//Víctor González S. wrong
let iterateAndMatch = (vote, array) => {
    return new Promise( (resolve, reject) =>{
	let matches = [];
	//let count = 0;
	return array.reduce( (sequence2, person) => {  
	    return sequence2.then( () => {
		return findBestMatch(person).then( (match) => {
		    matches.push(match);
		    //WARNING: could go into an infinite loop
		    if(matches.length === array.length){
			resolve(matches);
		    }
		}).catch( (error) => {
		    console.log(error);
		});
	    }).catch( (error) => {
		console.log(error);
	    });
	}, Promise.resolve());
    });
};

let createAsuntosDiputados = (voting) => {
    let asuntos_diputados = {};
    if(voting.result === null || voting.result === undefined){
	asuntos_diputados.resultado = 'NO DEFINIDO';
    }else{
	asuntos_diputados.resultado = voting.result;
    }
    asuntos_diputados.sesion = voting.session_id;
    asuntos_diputados.asunto = voting.subject;
    asuntos_diputados.ano = voting.year;
    asuntos_diputados.presidente = voting.president;
    asuntos_diputados.abstenciones = voting.abstention.length;
    asuntos_diputados.afirmativos = voting.yes.length;
    asuntos_diputados.negativos = voting.no.length;
    asuntos_diputados.titulo = voting.subject;
    asuntos_diputados.mayoria = 0;
    asuntos_diputados.presentes = voting.abstention.length + voting.yes.length + voting.no.length;
    asuntos_diputados.ausentes = 82 - asuntos_diputados.presentes;
    asuntos_diputados.base = '';
    asuntos_diputados.votopresidente = '';
    asuntos_diputados.permalink = '';
    asuntos_diputados.fecha = new Date(voting.date.split('/').reverse());    
    asuntos_diputados.hora = new Date(voting.date.split('/').reverse().join('-')+'T'+ voting.hour);    
    return AsuntosDiputados.create(asuntos_diputados);
};

let createVotacionesDiputados = (vote, voting) => {
    let votaciones_diputados = {};    
    if (vote === "yes"){
	votaciones_diputados.voto = 0;
    }else if (vote === "no"){
	votaciones_diputados.voto = 1;
    }else if (vote === "asbtention"){
	votaciones_diputados.voto = 2;
    }else if (vote === "excluded"){
	votaciones_diputados.voto = 3;
    }
    votaciones_diputados.asuntoId = voting.asuntoId;
    votaciones_diputados.diputadoId = voting.diputadoId;
    return Diputados
	.find(
	    {where: {diputadoId: voting.diputadoId}}
	).then( (result) => {
	    if(result === null){
		console.log('No se encontró el diputado');
	    }else{
		votaciones_diputados.bloqueId = result.bloqueId;
	    }
	    return VotacionesDiputados.create(votaciones_diputados);
	});
};

let votes = ['yes', 'no', 'asbtention', 'excluded'];

let mapVotings = () => {
    getVotings().then( (votings) => {
	votings.reduce( (sequence, voting) =>{
	    return sequence.then( () => {
		return createAsuntosDiputados(voting).then( (asunto) => {
		    return votes.reduce( (sequence2, vote) => {
			return sequence2.then( () => {
			    if(voting[vote] !== undefined && voting[vote].length > 0 ){
				return iterateAndMatch(vote, voting[vote]).then( (matches) => {				    
				    for(let match of matches){
					voting.asuntoId = asunto.asuntoId;
					voting.diputadoId = match.id;
					
					createVotacionesDiputados(vote, voting).then( (result) => {
					    console.log('created: ', result.asuntoId, result.diputadoId);
					}).catch( (error) =>{
					    console.trace(error);
					});
				    }
				});  
			    }else{
				return null;
			    }
			});
		    }, Promise.resolve());
		}).catch( (error) => {
		    console.log(error);
		});   
	    });
	},Promise.resolve());
    });
};

let mapDiputados = () => {
    return getDiputados().then( (diputados) => {
	console.log(diputados.length);
	return diputados.reduce( (sequence, diputado) => {
	    return sequence.then( () => {
		let nombre = diputado.nombres + ' ' + diputado.apellidos;
		let partido = diputado.partidoPolitico.split('.').join("");
		if (partido === "INDEPENDIENTE"){
		    partido = "IND";
		}
		BloquesDiputados
		    .find({where: { bloque: partido }
			     }).then( (result) => {
				 let bloqueId = result.bloqueId;
				 Diputados
				     .create({diputadoId: diputado.idParlamentario,
	     			 	      nombre: nombre,
	     			 	      distrito: diputado.departamento,
				 	      bloqueId: bloqueId
				 	     }).then( (d) => {
				 		 console.log('Created diputado: ', d.nombre);
				 	     }).catch( (error) => {
				 		 console.log('Partido politico ', diputado.partidoPolitico);
				 		 console.trace(error);
				 	     });
			     }) ;
	    });
	}, Promise.resolve());
    });
};

mapDiputados().then( () => {
    mapVotings();
});

