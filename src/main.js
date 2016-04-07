#!/usr/bin/env node

//TODO: add all calls to the rest of the scripts

//crawl sessions
//download rtf
//parse rtf
//map votaciones

import { crawlSessions, downloadRTFs, parseRTFandSave } from './scraper/votaciones-main';
import { mapAllToVotaciones } from './scraper/votaciones-mapper';
import mapAllBills from './scraper/billit-mapper';

//first argment is node path
//seccond is directory where it is runing
//and then the rest
let command = process.argv[2];//process.argv.slice(2, process.argv.length);
let args = process.argv.slice(3, process.argv.length);

let printHelp = () => {
    console.log("Usage: ");
    console.log("--crawl-sessions \t args: year, the year to crawl.");
    console.log("--download-rtfs \t downlad rtf files stored in the data base.");
    console.log("--parse-rtfs \t\t parses all dowonloaded rtfs and saves to monto db.");
    console.log("--map-votaciones \t maps diputados and voting results to votacionespa.");
    console.log("--map-bills \t\t maps all bills to bill-it.");
};
switch (command){
case "--help":
    printHelp();
    console.log("--help \t\t\t prints this message.");
    break;
case "--crawl-sessions":
    console.log("Crawling sessions");
    //check that the year is passed
    crawlSessions({anho: args[0]});
    break;
case "--download-rtfs":
    console.log("Downloading rtfs");
    downloadRTFs();
    break;
case "--parse-rtfs":
    parseRTFandSave();
    break;
case "--map-votaciones":
    mapAllToVotaciones();
case "--map-bills":
    mapAllBills();
    console.log("Uninemplented yet.");
    break;
default:
    printHelp();
    //console.log("if you don't know what you are doing just type --help");
}

