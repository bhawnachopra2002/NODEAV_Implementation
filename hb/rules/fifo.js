function applyfifobytimeout(entries, asyncObjects, relations) {
    let obj = asyncObjects.getAll().filter((o) => o.entry.type === 'Timeout');
    console.log("Applying fifo timeout rule");
    let g = {};
    obj.forEach(e => {
        let tick = relations.registeredIn(e.id);
        if (!g[tick])
            g[tick] = [];
        if(! g[tick].find((f) => f.entry.id === e.entry.id)){
            g[tick].push(e);
        }
    });

    for (let tck in g) {
        let t = g[tck];
        let i=0;
        let tlen = t.length - 1;
        while (i < tlen) {
            let j = i+1;
            while(j < tlen + 1) {
                let enti = t[i].entry.timeout;
                let entj = t[j].entry.timeout;
                if (enti <= entj)   
                    relations.add(t[i].id, t[j].id, 'timeout-l'); 
                j++;   
            }
            i++;
        }
    }
}

function applyfifobytype(entries, asyncObjects, relations) {
    console.log("Applying FIFO for Immediate, Next Tick and Promises");

    ['TickObject', 'Immediate'].forEach((type) => {
        let obj_non = asyncObjects.getAll()
        let obj = obj_non.filter((o) => o.entry.type === type);
        let g = 0;
        while (g < obj.length - 1) {
            let h = obj[g].id;
            let h1 = obj[g+1].id
            if (relations.registeredInSameTick(h, h1))
                relations.add(h, h1, type + '-l');
            g++;
        }
    });

    
    let promisesThen = entries.filter((entry) =>
            entry.e === 'AsyncHook-init' &&
            entry.type === 'PROMISE' &&
            entry.trigger !== entry.current);
    let f = 0;
    let pthen = promisesThen.length - 1;
    while (f < pthen) {
        if (promisesThen[f].trigger === promisesThen[f + 1].trigger && promisesThen[f].current === promisesThen[f + 1].current) { 
            let child = asyncObjects.getByAsyncId(promisesThen[f + 1].id);
            relations.add(asyncObjects.getByAsyncId(promisesThen[f].id)[0].id, child[0].id, 'promise-then');
            if (asyncObjects.getByAsyncId(promisesThen[f].id).length !== 1) { throw "Error"; }
            if (child.length !== 1) { throw "Error"; }            
        }
        f++;
    }

    let entry = entries.filter((entry) => entry.e === 'AsyncHook-promiseResolve' && entry.id !== entry.current);
    let p = 0;
    let entlen = entry.length - 1;
    while (p < entlen) {
        if (findRes(asyncObjects, entry[p]) == findRes(asyncObjects, entry[p + 1])) {
            relations.add(asyncObjects.getByAsyncId(entry[p].id)[0].id, asyncObjects.getByAsyncId(entry[p + 1].id)[0].id, 'promise-l');
            if (asyncObjects.getByAsyncId(entry[p].id).length !== 1) { throw "Error"; }
            if (asyncObjects.getByAsyncId(entry[p + 1].id).length !== 1) { throw "Error"; }
        }
        p++;
    }
}

function findRes(asyncObjects, entry) {
    let triggers = asyncObjects.getByAsyncId(entry.current);
    let triglen = triggers.length;
    if (triglen === 0)
        return null;

    for (let i = 0; i < triglen - 1; i++) {
        let a = entry.logindex > triggers[i].beforeindex;
        let b = entry.logindex < triggers[i + 1].beforeindex;
        if (a && b)
            return triggers[i];
    }
    return triggers[triglen - 1];
}

module.exports = { applyfifobytimeout, applyfifobytype }