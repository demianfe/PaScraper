'use strict';
import fs from 'fs';
import util from 'util';
import exec from 'child_process';

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

export let promisifiedExec = (command) => {
     return new Promise((resolve, reject) => {
    	 exec.exec(command, (error, stdout, stderr) => {
	     if(error) reject(error);
    	     resolve(stdout);
    	 });
    });   
};

export let rtfToHtml = (baseDir) => {
    let files = fs.readdirSync(baseDir);
    let commands = [];
    for (let file of files){
	commands.push(util.format('unrtf --html %s', baseDir + file));
    }
  return commands;
};

