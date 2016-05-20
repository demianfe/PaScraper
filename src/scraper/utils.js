'use strict';
import fs from 'fs';
import util from 'util';
import exec from 'child_process';
import mkdirp from 'mkdirp';

//trims spaces from a string
export let trimString = (string) => {
    return string.replace(/^\s+|\s+$/g,"");
};

//promisified fs readfile as it is an async function
export let promisifiedReadFs = (uri, encoding) => {
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

export let promisifiedWriteFs = (uri, content) => {
    return new Promise((resolve, reject) => {
	fs.writeFile(uri, content, (err, data) => {
	    if(err){
		reject(err);
	    }else{
		console.log('writen file');
		resolve(data);
	    }
	});
    });
};

export let promisifiedExec = (command, options=undefined) => {
    //TODO: extract fs options
    return new Promise((resolve, reject) => {
    	exec.exec(command, options, (error, stdout, stderr) => {
	    if(error) reject(error);
    	    resolve(stdout);
    	});
    });   
};

export let checkFileExistence = (fileName) => {
    //returns true if it exists
    //rejects if it does not.
    return new Promise( (resolve, reject) => {
	fs.access(fileName, fs.F_OK,  (err) => {
	    if(err) reject(err);
	    resolve(true);
	});	
    });
};

export let createDirectory = (dirName) => {
    if (!fs.existsSync(dirName)){
	mkdirp((dirName), (error) => {
	    if (error){
		console.error(error);
		throw error;
	    }else {
		console.log('Created dir:', dirName);
	    }
	});
    }
	
};
