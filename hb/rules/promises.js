function promiseAll(entries, asyncObjects, relations) {

    console.log("Checking Promises for all.")
    findPromiseAll(entries).forEach((p) => {
        p.forEach((i) => { relations.add(asyncObjects.getByAsyncId(i)[0].id, asyncObjects.getByAsyncId(p.shift())[0].id, 'promise-all');
        });
    });
}

function findPromiseAll(entries) {
    let ret = [];
    let curr = null;
    entries.forEach(objlog => {
        let cond1 = (objlog.e === 'AsyncHook-init');
        let cond2 = (objlog.type === 'PROMISE');
        let cond3 = (objlog.e === 'promise-all-end');
        if (objlog.e === 'promise-all-begin') {
            curr = [];
        }
        else if (curr && cond1 && cond2) {
            curr.push(objlog.id);
        }
        else if (cond3) {
            ret.push(curr);
            curr = null;
        }
    });
    return ret;
}

function promiseIndi(entries, asyncObjects, relations) {

    console.log("Promise resolution applied.")

    entries
        .filter((entry) => {entry.e === 'AsyncHook-promiseResolve' && entry.id !== entry.current})
        .forEach(entry => {
            if (!relations.happensBefore(asyncObjects.getByAsyncId(entry.id)[0].id, asyncObjects.getByCurrentId(entry).id))
                relations.add(asyncObjects.getByCurrentId(entry).id, asyncObjects.getByAsyncId(entry.id)[0].id, 'promise-resolve');
            let reqlen = asyncObjects.getByAsyncId(entry.id).length;
            if (reqlen!== 1) { throw "Error"; }
        });
}


module.exports = { promiseAll , promiseIndi }