/*
 author: Demian Florentin<demian@tedic.org>
 */

import Sequelize from 'sequelize';
import request from 'request-promise';
import { getVotings, getDiputados, saveObjects } from './mongo-client';

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


// let findBestMatch = (name) => {
//     //split name with spaces
//     let splitName = name.split(" ");
//     //query popit with the whole name
//     //iterate over the result and compare with the portions of the split name
//     //if one of the items in the result list contains all of the portions, that's our match
//     console.log(splitName);
//     return Promise.resolve();
// };

//TODO handle low scoring
let findBestMatch = (person) => {
    return new Promise( (resolve, reject) => {
	queryData.query.match.name = person;
	options.body = queryData;
	return request(options).then( (response) => {
	    if(response.hits !== undefined && response.hits.hits !== undefined
	       && response.hits.hits.length > 0 ){
		let results = [];
		//console.log('\t\t\tFound ', response.hits.hits.length, ' hits:', person);
		response.hits.hits.forEach( (hit) => {
		    results.push({id: hit._id,
				  name: hit._source.name,
				  score: hit._score});
		});		
		resolve(results);
	    }else{
		console.log('No match found for ', person);
		//console.log('query:', person, '---->', results);
		reject(person);
	    }
	}).catch( (error) => {
	    console.log("error at findBestMatch: ", person);
	    console.log(options.body);
	    //console.log(error.message);
	});
    });
};

export let createAsuntosDiputados = (voting) => {
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
	asuntos_diputados.titulo = voting.subject;
	//some subjects are too long
	if(voting.subject !==undefined && voting.subject.length >= 255){
	    asuntos_diputados.titulo = voting.subject.substring(0,254);
	}else{
	    asuntos_diputados.titulo = voting.subject;
	}    
	asuntos_diputados.mayoria = 0;
	asuntos_diputados.presentes = 0;
	if(voting.abstention !== undefined){
	    asuntos_diputados.abstenciones = voting.abstention.length;
	    asuntos_diputados.presentes += voting.abstention.length;
	}
	if(voting.yes !== undefined){
	    asuntos_diputados.afirmativos = voting.yes.length;
	    asuntos_diputados.presentes+= voting.yes.length;
	}
	if(voting.no !== undefined){
	    asuntos_diputados.negativos = voting.no.length;
	    asuntos_diputados.presentes += voting.no.length;
	}	
	asuntos_diputados.ausentes = 82 - asuntos_diputados.presentes;
	asuntos_diputados.base = '';
	asuntos_diputados.votopresidente = '';
	asuntos_diputados.permalink = voting.url;
	asuntos_diputados.sesion_url = voting.session_url;
	//TODO: fix dates formating
	//Date format : month starts from 0
	let date;
	if (voting.date === "" || voting.date === undefined){
	    console.log("no date provided");
	    date = new Date('20'+voting.session_id.substring(0,2),
			    Number(voting.session_id.substring(2,4))-1,
			    voting.session_id.substring(4,8));
	    asuntos_diputados.fecha = date;
	}else{
	    date = voting.date.split('/').reverse();
	    asuntos_diputados.fecha = new Date(date[0], Number(date[1])-1, date[2]);
	}if (voting.hour === "" || voting.hour === undefined){
	    //TODO
	    asuntos_diputados.hora = new Date(asuntos_diputados.fecha);
	}else{
	    asuntos_diputados.hora = new Date(voting.date.split('/').reverse().join('-')+'T'+ voting.hour);
	}
    return asuntos_diputados;
    //return AsuntosDiputados.create(asuntos_diputados);
};

let createVotacionesDiputados = (asuntoId, diputadoId, diputadoNombre, vote) => {
    return new Promise( (resolve, reject) => {
	let votaciones_diputados = {};
	
	if (vote == "yes"){
	    votaciones_diputados.voto = 0;
	}else if (vote == "no"){
	    votaciones_diputados.voto = 1;
	}else if (vote == "abstention"){

	    votaciones_diputados.voto = 2;
	}else if (vote == "excluded"){
	    votaciones_diputados.voto = 3;
	}
	
	votaciones_diputados.asuntoId = asuntoId;
	//console.log('asunto:', asuntoId, 'Diputado:', diputadoId, diputadoNombre, 'voto:',vote);
	votaciones_diputados.diputadoId = diputadoId;
	Diputados
	    .find({where: {diputadoId: diputadoId}}
		 ).then( (result) => {
		     if(result === null){
			 // console.log('No se encontró el diputado: '
			 // 	+ diputadoId + " " + diputadoNombre);
			 reject('No se encontró el diputado: '
			 	+ diputadoId + " " + diputadoNombre);
		     }else{
			 votaciones_diputados.bloqueId = result.bloqueId;
			 VotacionesDiputados.create(votaciones_diputados)
			     .then( (dbResponse) => {
				 // console.log("Creado exitosamente votacion",
				 // 		dbResponse.asuntoId, dbResponse.diputadoId);
				 resolve(dbResponse);
			     }).catch( (error) => {
				 console.log("Error al crear votacionesDiputados");
				 console.log(' ---> ',asuntoId, diputadoId, diputadoNombre, vote);
				 error = Object.assign({},
					   error,
					   {asunto: asuntoId,
					    diputado: diputadoId,
					    nombre:diputadoNombre,
					    voto: vote});
				 reject(error);
			     });
		     }		
		 }).catch( (error) => {
		     error = Object.assign({},
					   error,
					   {asunto: asuntoId,
					    diputado: diputadoId,
					    nombre:diputadoNombre,
					    voto: vote});
		     //console.log(error);
		     reject(error);
		 });
    });
};

let matchAndCreateAsuntosDiputados = (asuntoId, person, vote) => {
    return new Promise( (resolve, reject) => {
	return findBestMatch(person).then( (result) => {
	    //console.log(result);
	    result = result[0];
	    if(result !== undefined && result.id !== undefined && result.name !== undefined){
		return createVotacionesDiputados(asuntoId, result.id, result.name, vote).then( (result) =>{
		    resolve(result);
		}).catch( (error) => {
		    //console.log("error en matchAndCreateAsuntosDiputados");
		    //console.log("al llamar createVotacionesDiputados");
		    //console.trace(error);
		    reject(error);
		});
	    }else{
		//console.log("no se creo votacion dipuado.");
		reject("No se creo votacion diputado");
	    }
	}).catch( (error) => {
	    console.log("error en matchAndCreateAsuntosDiputados");
	    console.log("al tratar de matchear el diputado");
	    //console.trace(error);
	    reject(error);
	});
    });
};

let votes = ['yes', 'no', 'abstention', 'excluded'];

let mapVotings = () => {
    getVotings().then( (votings) => {
	votings.reduce( (sequence, voting) => {
	    return sequence.then( () => {
		return AsuntosDiputados.create(createAsuntosDiputados(voting)).then( (asunto) => {
		    return votes.reduce( (votesSequence, vote) => {
			return votesSequence.then( () => {
			    //if asuntosdiputados created successfully we find the best match for the name
			    //and then create diputadosVotaciones
			    return voting[vote].reduce( (votingSequence, person) => {
				return votingSequence.then( () => {
				    return matchAndCreateAsuntosDiputados(
					asunto.asuntoId, person, vote).catch( (error) => {
					    if (error.errors !== undefined ){
						console.log(error.errors[0].value);
						saveObjects('errors', {error: error, votting: voting});
						console.log(voting.fileName);
					    }
					});
				});
			    }, Promise.resolve());
			}).catch( (error) => {
			    console.log(error);
			});
		    },  Promise.resolve());
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
			      Diputados.create({diputadoId: diputado.idParlamentario,
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

export let mapAllToVotaciones = () => {
    console.log("Mapping all votings");
   mapDiputados().then( () => {
     	mapVotings();
   });
};
