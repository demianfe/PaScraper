'use strict';
import fs from 'fs';

//trims spaces from a string
export let trimString = (string) => {
    return string.replace(/^\s+|\s+$/g,"");
};

//promisified fs readfile as it is an async function
let promisifiedFs = (uri, encoding) => {
    return new Promise((resolve, reject) => {
	fs.readFile(uri, encoding, (err, data) => {
	    if(err){
		reject(err);
	    }else{
		resolve(data);
	    }
	});
    });
};
