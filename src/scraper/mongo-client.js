'use strict';
import MongoClient from 'mongodb';

const url = 'mongodb://localhost:27017/parlamentoabierto';

export let connectDb = (dburl) => {
    return new Promise((resolve, reject) =>{
	MongoClient.connect(dburl, (err, db) => {
	    if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
		reject(err);
	    } else {
		resolve(db);
	    }
	});
    });
};

export let saveObjects = (collection, objects) => {
    connectDb(url).then((db) =>{
	    db.collection(collection).insert(objects, (err, inserted) => {   
		if(err) throw err;
		return db.close();
	    });
    }).catch( (error) => {
	console.trace(error);
    });
};

export let upsertObject = (collection, object) => {
    connectDb(url).then((db) =>{
	console.log('upserting..', object._id);
	db.collection(collection)
	    .update({_id: object._id},
		    object,
		    {upsert: true},
		    (err, inserted) => {
			if(err) throw err;
			return db.close();
		    });	
    }).catch( (error) => {
	console.trace(error);
    });
};

export let insertToCollection = (collection, object) => {
    connectDb(url).then((db) =>{
	db.collection(collection).insert(object, (err, inserted) => {
	    if(err) throw err;
	    return db.close();
	});	
    }).catch( (error) => {
	console.trace(error);
    });
};

export let saveSession = (sesion) =>{
    connectDb(url).then((db) =>{
	console.log('saving new sesion to db');
	db.collection('sesiones').insert(sesion, (err, inserted) => {
	    if(err) throw err;
	    console.dir('Successfully inserted', JSON.stringify(inserted));
	    return db.close();
	});
    }).catch( (error) => {
	console.trace(error);
    });
};

export let saveCongressmen = (congressmen) => {
    connectDb(url).then( (db) =>{
	db.collection('congressmen').insert(congressmen, (err, inserted) =>{
	    if (err) throw err;    
	    console.dir('Successfully inserted', JSON.stringify(inserted));
	    return db.close();
	});
    });    
};

let readCongressmen = (db, cursor) =>{
    return new Promise( (resolv, reject) => {
	let congressmen = [];
	cursor.each( (err, doc) => {
	    if (err) throw err;
	    if (doc != null){
		congressmen.push(doc);
	    }else{
		resolv(congressmen);
		cursor.close();
		db.close();
	    }
	});	
    });
};

export let getCongressmenByPeriod = (period) => {
    return connectDb(url).then( (db) => {
	let cursor = db.collection('parlamentarios')
		.find({'periodoLegislativo':period});
	return readCongressmen(db, cursor);
    }).then( (congressmen) => {
	console.log('returning ' + congressmen.length + ' congressmen');
	return congressmen;
    }).catch( (error) => {
	console.trace(error);
	throw error;
    });
};

export let getCongressmanById = (id) => {
    return connectDb(url).then((db) =>{
	let p = db.collection('parlamentarios')
		.findOne({"idParlamentario": Number.parseInt(id)})
		.then( (result)=> {
		    db.close();
		    return result;
		});
	return p;
    });
};

export let removeCollection = (collection, query) => {
    if(query == null || query == undefined){
	query = {};//remove all
    }

    return connectDb(url).then( (db) => {
	console.log('Removing collection ', collection);
	db.collection(collection).remove(query);
	db.close();
    });
};

export let getUniqueBills = () => {
    //this function returns the bills
    //associated to every congressman
    return connectDb(url).then( (db) =>{
	let cursor = db.collection('parlamentario_proyectos').find();
	let uniqueIds = {};
	let result = [];
	return new Promise( (resolve, reject) => {
	    cursor.each( (error, element) => {
		if (element != null){
		    element.proyectos.forEach( (project) => {
			if (project != null )
			    if (project.idProyecto in uniqueIds == false){
				uniqueIds[project.idProyecto] = project;
				result.push(project);
			    }
		    });
		}else{
		    //return ids only
		    cursor.close();
		    db.close();
		    resolve(result);
		}
	    });
	});
     }).catch( (error) => {
	    console.trace(error);
     });;
};

export let countUniqueBills = () => {
    //is this actually needed ?
    return connectDb(url).then( (db) =>{
	return new Promise( (resolve, reject) => {
	  db.collection('bills').count().then( (result) => {
	      resolve(result);
	      db.close();
	    });
	});
     }).catch( (error) => {
	    console.trace(error);
     });;
};

export let getSessionsWithVotings = () => {
    return new Promise( (resolve, reject) => {
	connectDb(url).then( (db) => {
	    let cursor = db.collection('sesiones')
		    .find({'details.votings.link': {$exists:true}});
	    let sessions = [];
	    cursor.each( (error, sesion) => {
		if (error != null) reject(error);
		if (sesion !== null){
		    sessions.push(sesion);
		}else{
		    db.close();
		    resolve(sessions);
		}
	    });
	});
    });
};

export let getRTFLinks = () => {
    return new Promise( (resolve, reject) => {
	getSessionsWithVotings().then( (sesiones) => {
	    let links = [];
	    for(let sesion of sesiones){
    		for (let detail of sesion.details){
		    if(detail.votings !== undefined && detail.votings.length > 0){
		    	for(let voting of detail.votings){
		    	    links.push({session_id: sesion.id,
					link: sesion.id + '/' + voting.link});
		    	}
		    }
    		}
	    }
	    resolve(links);
	}).catch( (error) => {
	    console.treace(error);
	});
    });
};

export let getDownloadedRTF = () =>{
    return new Promise( (resolve, reject) => {
	connectDb(url).then( (db) => {
	    let cursor = db.collection('downladed_rtf').find();
	    let rtfList = [];
	    cursor.each( (error, rtf) => {
		if (error != null) reject(error);
		if (rtf !== null){
		    rtfList.push(rtf);
		}else{
		    db.close();
		    resolve(rtfList);
		}
	    });
	}).catch( (error) => {
	    console.treace(error);
	});
    });
};

export let getVotings = () => {
    return new Promise( (resolve, reject) => {
	connectDb(url).then( (db) => {
	    let result = [];
	    //if those list are empty there's nothing to do.
	    let cursor = db.collection('votings')
		    .find(
			{ $or: [
			    {yes: {$ne: []}},
			    {no: {$ne: []}},
			    {abstention: {$ne: []}},
			    {excluded : {$ne: []}}
			]});
	    cursor.each( (error, voting) => {
		if (error != null) reject(error);
		if (voting !== null){
		    result.push(voting);
		}else{
		    db.close();
		    cursor.close();
		    resolve(result);
		    
		}
	    });
	}).catch( (error) => {
	    console.treace(error);
	    reject(error);
	});
    });
};

export let getDiputados = () => {
    return new Promise( (resolve, reject) => {
	connectDb(url).then( (db) => {
	    let result = [];
	    let cursor = db.collection('parlamentarios')
		    .find({camaraParlamentario : "CAMARA DE DIPUTADOS",
			   periodoLegislativo: "2013-2018"});
	    cursor.each( (error, item) => {
		if (error != null) reject(error);
		if (item !== null){
		    result.push(item);
		}else{
		    db.close();
		    resolve(result);
		}
	    });
	}).catch( (error) => {
	    console.treace(error);
	    reject(error);
	});
    });
};

export let getSessionById = (id) => {
    return new Promise( (resolve, reject) => {
	connectDb(url).then( (db) =>{
	    let s = db.collection('sesiones')
		    .findOne({id: id});
	    s.then( (data) => {
		resolve(s);
		db.close();
	    });
	}).catch( (error) => {
	    console.treace(error);
	    reject(error);
	});
    });
};

export let getSessionVotings = (sessionId) => {
    return new Promise( (resolve, reject) => {
	connectDb(url).then( (db) => {
	    let result = [];
	    //if those list are empty there's nothing to do.
	    let cursor = db.collection('votings')
		    .find({session_id: sessionId});
	    cursor.each( (error, voting) => {
		if (error != null) reject(error);
		if (voting !== null){
		    result.push(voting);
		}else{
		    db.close();
		    cursor.close();
		    resolve(result);		    
		}
	    });
	}).catch( (error) => {
	    console.treace(error);
	    reject(error);
	});
    });
};

export let congressmanBills = (congressmanId) => {
    return connectDb(url).then( (db) => {
	let obj = db.collection('parlamentario_proyectos')
		.findOne({"idParlamentario" : Number.parseInt(congressmanId)})
		.then( (result) => {
		    db.close();
		    return result;
		});
	return obj; 
    });
};

export let congressmenBills = () => {
    return new Promise( (resolve, reject) =>{
	let result = [];
	connectDb(url).then( (db) => {
	    let cursor = db.collection('parlamentario_proyectos').find();
	    cursor.each( (error, item) => {
		if (error != null) reject(error);
		if (item != null){
		    result.push(item);
		}else{
		    cursor.close();
		    db.close();
		    resolve(result);
		}
	    });
	});
    });
};

export let getBills = (skip, limit) => {
    //this function brings all bills from bills collection
    return new Promise( (resolve, reject) =>{
	let cursor;
	connectDb(url).then( (db) => {
	    if(skip !== undefined && limit !== undefined){
		cursor = db.collection('bills')
		    .find().skip(skip).limit(limit);
	    }else{
		cursor = db.collection('bills').find();
	    }
	    let result = [];
	    cursor.each( (error, item) => {
		if (error != null) reject(error);
		if (item != null){
		    result.push(item);
		}else{
		    cursor.close();
		    db.close();
		    resolve(result);
		}
	    });
	});
    });
};

;
