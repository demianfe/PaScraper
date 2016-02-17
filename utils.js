'use strict';
import fs from 'fs';
import util from 'util';
import exec from 'child_process';

//trims spaces from a string
export let trimString = (string) => {
    return string.replace(/^\s+|\s+$/g,"");
};

//promisified fs readfile as it is an async function
export let promisifiedFs = (uri, encoding) => {
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

let promisifiedExec = (command) => {
     return new Promise((resolve, reject) => {
    	 exec.exec(command, (error, stdout, stderr) => {
	     if(error) reject(error);
    	     resolve(stdout);
    	    });
    });   
};

export let rtfToHtml = (baseDir) => {
    /* returns a list of promises
     that will perform the transformation
     from rtf to html using unrttf
     */
    let files = fs.readdirSync(baseDir);
    let promises = [];
    for (let file of files){
	let command = util.format('unrtf --html %s', baseDir + file);
	promises.push(promisifiedExec(command));
    }
  return promises;
};

