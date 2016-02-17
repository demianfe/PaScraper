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
		//console.log('Connection established to', dburl);
		resolve(db);
	    }
	});
    });
};

//we are saving this just as they come
//collection is the name of database collection
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

export let saveSession = (session) =>{
    connectDb(url).then((db) =>{
	console.log('saving new session to db');
	db.collection('sessions').insert(session, (err, inserted) => {
	    if(err) throw err;
	    console.dir('Successfully inserted', JSON.stringify(inserted));
	    return db.close();
	});
    }).catch( (error) => {
	console.trace(error);
    });
};

export let saveCongressmen = (congressmen) => {
    connectDb(url).then(( db) =>{
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
		db.close();
	    }
	});	
    });
};

export let getCongressmenByPeriod = (period) => {
    return connectDb(url).then( (db) =>{
	let cursor = db.collection('parlamentarios')
		.find({'periodoLegislativo':period});
	return readCongressmen(db, cursor);
    }).then( (congressmen) => {
	//console.log(congressmen);
	return congressmen;
    }).catch( (error) => {
	console.trace(error);
	throw error;
    });
};

