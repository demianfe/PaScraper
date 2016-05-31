#!/usr/bin/env node

import { crawlSessions, downloadRTFs, parseRTFs } from './scraper/votaciones-main';
import { mapAllToVotaciones } from './scraper/votaciones-mapper';
import { getCongressmenData, getBillsRelatedData,
	 downloadBills, updateBills } from './scraper/silpy-api-client.js';
import { mapBillit } from './scraper/billit-mapper';

//first argument is node path
//seccond is directory where it is runing
//and then the rest
let command = process.argv[2];//process.argv.slice(2, process.argv.length);
let args = process.argv.slice(3, process.argv.length);

let printHelp = () => {
    console.log("Usage: ");
    console.log("--crawl-sessions \t args: year, the year to crawl.");
    console.log("--download-rtfs \t downlad rtf. Args: year, download files from that year.");
    console.log("--parse-rtfs \t\t parses all dowonloaded rtfs and saves to monto db.");
    console.log("--map-votaciones \t maps diputados and voting results to votacionespa.");
    console.log("--get-congressmen \t downloads congressmen data.");
    console.log("--download-bills \t\ Download all bills related to all congressmen \n \
\t\t\t within this parlamentary period.");
    console.log("--download-bills-files \t\ Download files related to bills. \n\
\t\t\t --download-bills should be executed before.");
    console.log("--map-bills \t\t maps all bills to bill-it.");
    console.log("--update-bills \t\t updates bills with status \"EN TRAMITE\"");
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
    downloadRTFs(args[0]);
    break;
case "--parse-rtfs":
    parseRTFs();
    break;
case "--map-votaciones":
    mapAllToVotaciones();
    break;
case "--get-congressmen":
    getCongressmenData();
    break;
case "--download-bills":
    getBillsRelatedData();
    break;
case "--download-bills-files":
    if(args[0] == 'new'){
	downloadBills(true);
    }else{
	downloadBills();
    }    
    break;
case "--map-bills":
    mapBillit();
    break;
case "--update-bills":
    updateBills();
    break;
default:
    printHelp();
    //console.log("if you don't know what you are doing just type --help");
}

