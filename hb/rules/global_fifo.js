
const {fifobytimeout, fifobytype} = require('./g_fifo_rules');

function globalfifo(entries, asyncObjects, relations) {
    let newRelationsFound = false; 
    let asyncObj = asyncObjects.getAll();
    let i = 0;
    let asyncobjlen = asyncObj.length;
    while (i < asyncobjlen) {
        let j = i + 1;
        while (j < asyncobjlen) {
            let aoi = asyncObj[i], aoj = asyncObj[j];
            let entrycond = (aoi.entry.type === aoj.entry.type);
            let relhbij = relations.happensBefore(aoi.id, aoj.id);
            let relhbji = relations.happensBefore(aoj.id, aoi.id);
            if ( entrycond &&
                !relhbij &&
                !relhbji) {
                switch (aoi.entry.type) {
                    case 'Immediate':
                    case 'TickObject':
                    case 'PROMISE':
                        if (fifobytype(relations, aoi, aoj))
                            newRelationsFound = true;
                        break;
                    case 'Timeout':
                        if (fifobytimeout(relations, aoi, aoj))
                            newRelationsFound = true;
                        break;
                }
            }

            let first = (aoi.entry.type !== aoj.entry.type);
            let second = (aoi.entry.type === 'TickObject' || aoj.entry.type === 'TickObject');
            if (first && second &&
                !relations.happensBefore(aoi.id, aoj.id) &&
                !relations.happensBefore(aoj.id, aoi.id)) {
                if (next_tick(relations, aoi, aoj))
                    newRelationsFound = true;
            }
            j++;
        }
        i++;
    }
}

function next_tick(relations, aoi, aoj) {
    if(aoj.entry.type === 'TickObject') {  
        let temp = aoi;
        aoi = aoj;
        aoj = temp;
    }
    
    let foundRelation = false;
    let cond = true;
    if (!relations.registeredIn(aoi.id)){
        cond = false;
    }
    cond = relations.happensBefore(relations.registeredIn(aoi.id), aoj.id);
    if (cond) {
        relations.add(aoi.id, aoj.id, aoi.entry.type + '-difftype-g');
        foundRelation = true;
    }
    return foundRelation;
}



module.exports = { globalfifo }