function attend(aoi, aoj, relations) {
    let par_cbi, par_cbj;
    if (aoi.entry.type === 'PROMISE') {
        par_cbi = relations.resolvedIn(aoi.id);
        if (!par_cbi)
            par_cbi = relations.registeredIn(aoi.id);
        par_cbj = relations.resolvedIn(aoj.id);
        if (!par_cbj)
            par_cbj = relations.registeredIn(aoj.id);
    }
    else {
        par_cbi = relations.registeredIn(aoi.id);
        par_cbj = relations.registeredIn(aoj.id);

    }

    if (!par_cbi || !par_cbj)
        return false;

    return relations.happensBefore(par_cbi, par_cbj);
}
function fifobytype(relations, aoi, aoj) {
    let foundrel = false;
    if (attend(aoi, aoj, relations)) {
        relations.add(aoi.id, aoj.id, aoi.entry.type + '-g');
        foundrel = true;
    }

    if (!foundrel) {   //try the other way
        if (attend(aoj, aoi, relations)) {
            relations.add(aoj.id, aoi.id, aoi.entry.type + '-g');
            foundrel = true;
        }
    }
    return foundrel;
}
function fifobytimeout(relations, aoi, aoj) {
    let foundrel = false;
    let isibef = aoi.entry.timeout <= aoj.entry.timeout;
    if ( isibef && attend(aoi, aoj, relations)) {
        relations.add(aoi.id, aoj.id, aoi.entry.type + '-g');
        foundrel = true;
    }
    isjbef = aoj.entry.timeout <= aoi.entry.timeout;
    if (!foundrel) {   //try the other way
        if (isjbef && attend(aoj, aoi, relations)) {
            relations.add(aoj.id, aoi.id, aoi.entry.type + '-g');
            foundrel = true;
        }
    }
    return foundrel;
}
module.exports = { fifobytimeout , fifobytype }