'use strict';

import MongoClient from 'mongodb';

const url = 'mongodb://localhost:27017/parlamentoabierto';

let connectDb = (dburl) => {
    return new Promise((resolve, reject) =>{
	MongoClient.connect(dburl, (err, db) => {
	    if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
		reject(err);
	    } else {
		console.log('Connection established to', dburl);
		resolve(db);
	    }
	});
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
