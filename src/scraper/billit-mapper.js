'use strict';

import request from 'promise-request';
import getUniqueBills from 'mongo-client'
;
const host = 'http://localhost:8002';
const secret_token = '75cc973db60d3e07beaa1630c4cb37ded228e5bb71853be068a573b1a2ee385379111f9b12847b285a7e2c2b2f918b2902f4edb04046319cf41148a642fa53d3';


let headers = {"Content-Type": "application/json",
               "X-CSRF-Token": secret_token};

let getChamber = (chamber) => {
    if (chamber === "CAMARA DE DIPUTADOS") return "C. Diputados";
    else if (chamber === "CAMARA DE SENADORES") return "Senado";
    return chamber;
};

let  updateOrCreate = () => {
    //get all projects from "updated_bills" collection
    //verify if the collection exists already
    //if does not make post request
    //otherwise make put request
    // updated_bills = mdb.updated_bills.find_one()
    // last_update = updated_bills['last_update']
    
    // #print updated_bills[last_update]['bills'][1]
    // for b in updated_bills[last_update]['bills']:
    //     bill_id= b['info']['file']
    //     bill = create_bill_object(b)
    //     r = requests.get(host + '/bills/' + bill_id)
    //     if r.status_code == 200:
    //         print "Updating Bill %s" %(bill_id)
    //         r = requests.put(host + '/bills', data=json.dumps(bill.__dict__))
    //     elif r.status_code == 404:
    //         print "Creating new Bill %s" %(bill_id)
    //         r = requests.post(host + '/bills', data=json.dumps(bill.__dict__))
};

let mapBillit = () => {

    let offset = 50;
    let start = 0;
    let end = offset;
    let total = 0; //get all projects and count

    while (end < total){
        if (total - end > offset){
            end += offset;
        }else{
            end = total;
	}
	
        // projects = mdb.projects.find()[start:end]
        // post_projects(projects)
        // print "-------------------------"
        // print "start " + str(start)
        // print "end " + str(end)
        // print "diff " + str(total - end)
        // print "-------------------------"
        // start = end
    }
};
    
let createBillObject = (p) => {
    let bill = {};
    bill.scrap_id = p['id'];
    if ('title' in p){
        bill.title = p['title'];
    }if ('entry_date' in p){
        bill.creation_date = p['entry_date'];
    }if ('info' in p){
        let info = p['info'];
        bill.uid = info['file'];
        if ('origin' in info){
            bill.initial_chamber = get_chamber(info['origin']);
            bill.source = info['iniciativa'];
            //if 'subject' in p['info']:
            //    bill.title = p['info']['subject']
        }if ('heading' in info){
            bill.abstract = info['heading'];
	}if ('importance'in info){
            if (info['importance'] == "SIN URGENCIA"){
                bill.urgent = 'Simple';
            }else{
                bill.urgent = info['importance'];
	    }
	}if ('stage' in p){
            stage = p['stage'];
        }if ('stage' in stage){
            bill.stage = stage['stage'];
	}if ('sub_stage' in stage){
            bill.sub_stage = stage['sub_stage'];
	}if ('status' in stage){
            bill.status = stage['status'];
            bill.authors = [];
	}
    }if ('authors' in p){
        for (author of p['authors']){
            bill.authors.append(str(author['id']) + ':'+author['name']);
	}
    }
    //paperworks
    bill.paperworks = [];
    if ('paperworks' in p){
        for (let paperwork of p['paperworks']){
            let new_paperwork = {};
            if ('session' in paperwork){
		new_paperwork.session = paperwork['session'];
            } if ('date' in paperwork){
                new_paperwork.date = paperwork['date'];
	    }if ('chamber' in paperwork){
                new_paperwork.chamber = getChamber(paperwork['chamber']);
            }if ('stage' in paperwork){
                new_paperwork.stage = paperwork['stage'];
            }if ('result' in paperwork){
                if ('value'in paperwork['result']){
                    new_paperwork.timeline_status = paperwork['result']['value'];
                    bill.paperworks.append(new_paperwork.__dict__);
		   }
	    }
	}
    }
    //documents
    bill.documents = [];
    if ('documents' in p){
        for (let doc of p['documents']){
            document = {};
            if ('registration_date' in doc){
                document.date = doc['registration_date'];//#, :type => DateTime
	    }if ('type' in doc){
                document.type = doc['type']; // :type => String
                //TODO: generar link a documento
                // document.number#, :type => String
                // document.step = doc['']#, :type => String
                // document.stage = doc['']#, :type => String
                // document.chamber = doc['']#, :type => String
                document.link = doc['name'];//#, :type => String
	    }
            bill.documents.append(document.__dict__);
	}
    }
    //Directives
    bill.directives = [];
    if ('directives' in p){
        if (p['directives']){
            for (let d of p['directives']){
                let directive = {};
                if ('date' in d){
                    directive.date = d['date'];//#, :type => DateTime
                }if ('result' in d){
                    directive.step = d['result'];// #, :type => String
                    //directive.stage #, :type => String ?
                    //directive.link #, :type => String ?
		}	 
                bill.directives.append(directive.__dict__);
	    }
	}
    }
    return bill;
};

let postProjects = (projects) =>{
    for(let p of projects){
        console.log("loading bill with uuid= %s" %(p['id']));
        let bill = createBillObject(p);
	
        //r = requests.post(host + '/bills', data=json.dumps(bill.__dict__))
        //print "------------------------------------------------------------------------------  "
        //print r.content
    }
};
