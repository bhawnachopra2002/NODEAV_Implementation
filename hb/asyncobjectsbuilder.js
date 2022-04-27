class AsyncObjects {
    constructor(pObjects) {
        this.objects = pObjects;
    }

    getAll() {
        return this.objects;
    }

    checkEquality(a,b){
        return a === b;
    }

    getByAsyncId(asyncId) {
        let foundbyid = this.objects.filter((curr_obj) => this.checkEquality(curr_obj.entry.id , asyncId));
        return foundbyid;
    }

    getByCurrentId(entry) {
        let triggers = this.getByAsyncId(entry.current);
        let triglen = triggers.length
        if ( triglen === 0)
            return null;
        let i = 0;

        while (i < triglen - 1) {
            let cond1 = entry.logindex > triggers[i].beforeindex;
            let cond2 = entry.logindex < triggers[i + 1].beforeindex;
            if (cond1 && cond2)
                return triggers[i];
            i++;
        }
        return triggers[triglen- 1];
    }

    objConditions(obj,f){
        let cond1 = obj.callback
        let cond2 = (obj.callback.file === f.file);
        let cond3 = (obj.callback.name === f.name);
        let cond4 = (obj.callback.line === f.line);
        return cond1 && cond2 && cond3 && cond4;
    }
    hasFunction(f) {
        let ret = this.objects.find((obj) => this.objConditions(obj,f));
        let exists = (ret !== undefined);
        return exists;
    }

    findAsyncObjectsByFunction(fn) {
        found_obj = this.objects.filter((obj) => this.objConditions(obj,fn));
        return found_obj;
    }

    findAsyncObjectsById(id) {
        found_obj = this.objects.find((o) => this.checkEquality(o.id, id));
        return found_obj;
    }
}

class AsyncObjectsBuilder {
    constructor() {
        this.objects = []
        this.functionCallsMap = new Map();
    }

    extract(entries) {
        this.addIndexes(entries);
        this.dealWithMainModule(entries);
        this.initAsyncObjects(entries);
        this.associateCallbacks(entries);

        let myobj = new AsyncObjects(this.objects);
        return myobj;
    }

    addIndexes(entries) { 
        let index = 0;
        entries = entries.map((e) => {
            e.logindex = index;
            index++;
            return e;
        });
    }
    
    checkEquality(a, b){
        return a === b;
    }

    dealWithMainModule(entries) {
        let self = this;
        let mainentry = {
            id: 1,
            entry: {
                e: 'AsyncHook-init',
                id: 1,
                trigger: 0,
                type: 'main',
                current: 0
            }
        };

        let maincall = entries.find((entry) => this.checkEquality(entry.current, 1) && this.checkEquality(entry.e, 'call-entry'));
        if (maincall)
            mainentry.callback = {
                name: maincall.function,
                file: maincall.file,
                line: maincall.line,
                args: maincall.args,
                logindex: maincall.logindex,
                instance: this.calculateInstanceOrder(maincall)
            };

        self.objects.push(mainentry);
    }

    calculateInstanceOrder(entry) {
        let funcInst = this.functionCallsMap.get(entry.function + '#' + entry.file + '#' + entry.line);
        if (!funcInst)
            funcInst = 0;
        this.functionCallsMap.set(entry.function + '#' + entry.file + '#' + entry.line, ++funcInst);

        return funcInst;
    }

    initAsyncObjects(entries) {
        let self = this;
        let currentId = 1;

        entries
            .filter((entry) => this.checkEquality(entry.e, 'AsyncHook-init'))
            .forEach(entry => {
                entries
                    .filter((b_entry) => b_entry.e === 'AsyncHook-before' &&
                    this.checkEquality(b_entry.id, entry.id))
                    .forEach((b_entry) => {
                        self.objects.push({
                            id: ++currentId,
                            entry: entry,
                            beforeindex: b_entry.logindex
                        });
                    });
            });

        //promises and object initiated but not exercised
        entries
            .filter((entry) => this.checkEquality(entry.e, 'AsyncHook-init'))
            .forEach(entry => {
                //if not treated by previous case
                if (this.getByAsyncId(entry.id).length === 0) {
                    let b_entry = entries.find((b_entry) => b_entry.e === 'AsyncHook-promiseResolve' &&
                        b_entry.id === entry.id);
                    if (b_entry)
                        self.objects.push({
                            id: ++currentId,
                            entry: entry,
                            beforeindex: b_entry.logindex
                        });
                    else    //object only initiated
                        self.objects.push({
                            id: ++currentId,
                            entry: entry,
                            beforeindex: entry.logindex
                        });
                }
            });
    }

    associateCallbacks(entries) {
        entries
            .filter((entry) => entry.e === 'call-entry')
            .forEach((entry) => {
                let asyncObj = this.findAssociatedAsyncObject(entry);
                if (!asyncObj.callback) {
                    asyncObj.callback = {
                        name: entry.function,
                        file: entry.file,
                        line: entry.line,
                        args: entry.args,
                        logindex: entry.logindex,
                        instance: this.calculateInstanceOrder(entry)
                    };
                }
            });
    }

    findAssociatedAsyncObject(targetEntry) {
        let ret_filtered = this.objects.filter((asyncObj)=> targetEntry.current === asyncObj.entry.id);
        for (let i = 0; i < ret_filtered.length - 1; i++) {
            if (targetEntry.logindex > ret_filtered[i].beforeindex && targetEntry.logindex < ret_filtered[i + 1].beforeindex)
                return ret_filtered[i];
        }
        return ret_filtered[ret_filtered.length - 1];
    }

    getByAsyncId(AsyncId) {
        return this.objects.filter((obj) => obj.entry.id === AsyncId);
    }
}

module.exports = { AsyncObjects , AsyncObjectsBuilder }