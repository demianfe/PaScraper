import Sequelize from 'sequelize';
import request from 'request-promise';
import getDiputados from 'db-client';

var sequelize = new Sequelize('votacionespa', 'carga', '123456', {
    host: 'localhost',
    dialect: 'mysql',

    pool: {
	max: 5,
	min: 0,
	idle: 10000
    }
});

var  BloquesDiputados = sequelize.import(__dirname + "/model/bloques_diputados");
var  Diputados = sequelize.import(__dirname + "/model/diputados");

let getAllBloques =  () => {
    return new Promise( () => {
	BloquesDiputados.findAll().then( (bloques) => {
	    //TODO
	    for(let bloque of bloques){
		console.log(bloque.bloqueId, bloque.bloque);
		sequelize.close();
	    }
	});
    });
};

//TODO:
// - get voters form mongo
// - define the structure and all the data needed
//    to insert in the mysql db
// - look up in popit
// - try to match it
// - save to pavotaciones mysql

//getAllBloques();
// Diputados.findAll().then( (diputados) => {
//     for(let diputado of diputados){
// 	console.log(diputado.diputadoId, diputado.nombre);
// 	sequelize.close();
//     }
// });

// let popitUrl = 'http://parlamento.popit.parlamentoabierto.org.py:8000/api/v0.1/'
//  + 'search/persons?';
// let query = 'q=name:Hugo&name:Velazquez';
//popitUrl + query,

let elasticSearchURL =  'http://localhost:9200/popitdev_parlamento/_search?';
let queryString	= {"query": {"match": {"name": "Hugo Velázquez"}}};

let options = {
    method: 'XPOST',
    uri: elasticSearchURL,
    body: queryString,
    json: true};

request(options).then( (response) => {
    //console.log(response.hits.hits);
    response.hits.hits.forEach( (item) => {
    	//maybe query twice: one for the forename
    	// one for the lastname
	//	console.log(item);
	console.log(item._score, item._source.name);
    });

});
