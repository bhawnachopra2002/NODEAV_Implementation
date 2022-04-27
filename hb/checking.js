const fs = require('fs');
const path = require('path');
const {AsyncObjects , AsyncObjectsBuilder} = require('./asyncobjectsbuilder');
const Relations = require('./relations');
const applyRules = require('./applyrules');
const generateGraph = require('./graphutil');

function reduceGraph(asyncObjects, relations) {
    let newObjs = [];
    let nr = new Relations();
    asyncObjects.getAll().forEach(obj => {
        if (obj.callback)
            newObjs.push(obj);
    });

    relations.startGraphDS(asyncObjects.getAll());
    let u=0;
    let lennew= newObjs.length
    while(u<lennew){
        u++;
        for (let j = i + 1; j < newObjs.length; j++) {
            let oi = newObjs[i];
            let oj = newObjs[j];
            if (!nr.happensBefore(oi.id, oj.id) && !nr.happensBefore(oj.id, oi.id)) {  
                if (relations.hBGraphLib(oi.id, oj.id))
                    nr.add(oi.id, oj.id, '');
                else
                    if (relations.hBGraphLib(oj.id, oi.id))
                        nr.add(oj.id, oi.id, '');
            }
        }
    }

    //some edges in nr are duplicated; try to remove them
    removeDuplicate(nr);

    return {
        asyncObjects: new AsyncObjects(newObjs),
        relations: nr
    };
}

function removeDuplicate(nr) {
    let allr = [...nr.hb];
    for (let r of allr) {
        if (!r.type) {          //not a optional edge
            // console.log(r);
            nr.remove(r.a, r.b);
            if (!nr.happensBefore(r.a, r.b)) {  //relation not preserved
                nr.add(r.a, r.b, '');   //put it back and continue
            }
        }
    }
}
function identifier(args) {
    args.file = path.resolve(args.file);
    if (!fs.existsSync(args.file))
        throw 'file does not exist.';

    var { entries } = JSON.parse(fs.readFileSync(args.file));

    var currAsyncObjectsBuilder = new AsyncObjectsBuilder();
    
    console.log("Building objects from json");

    var asyncObjects = currAsyncObjectsBuilder.extract(entries);

    var relations_new = new Relations();

    console.log("applying rules")
    applyRules(entries, asyncObjects, relations_new, { global: !args.noglobal });

    
    console.log("generating a reduced graph with callback nodes only ")
    var rg = reduceGraph(asyncObjects, relations_new);

    var HappenBeforeFileName = args.file.replace('.log.json', '.hb-full.json');
    console.log(HappenBeforeFileName);
    fs.writeFileSync(HappenBeforeFileName, JSON.stringify({ asyncObjects, relations_new }, null, 4), 'utf-8');

    var reducedHappenBeforeFileName = args.file.replace('.log.json', '.hb.json');
    console.log(reducedHappenBeforeFileName);
    fs.writeFileSync(reducedHappenBeforeFileName, JSON.stringify({
        asyncObjects: rg.asyncObjects,
        relations: rg.relations_new
    }, null, 4), 'utf-8');

    if (args.image) {

        console.log("Here");
        var figName = args.file.replace('.log.json', '.hb-graph-full.png');
        generateGraph(figName, { nodes: asyncObjects.getAll(), edges: relations_new.hb });
        }
}

module.exports = identifier