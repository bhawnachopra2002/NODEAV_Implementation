function regist(entries, asyncObjects, relations) {

    console.log("Registering caller event of callback");

    asyncObjects.getAll().forEach(asyncObj => {
        if (findRegistrationofAsyncObject(asyncObjects, asyncObj))
            relations.add(findRegistrationofAsyncObject(asyncObjects, asyncObj).id, asyncObj.id, 'registration');
    });
}

function findRegistrationofAsyncObject(asyncObjects, asyncObj) {
    let triggers = asyncObjects.getByAsyncId(asyncObj.entry.trigger);
    let cond1 = asyncObj.entry.trigger !== asyncObj.entry.current;
    let cond2 = asyncObj.entry.type === 'TickObject';
    if ( cond1 && cond2) {
        triggers = asyncObjects.getByAsyncId(asyncObj.entry.current);        
    }
    if (triggers.length === 0)
        return null;
    let i = 0;
    let triglen = triggers.length - 1;
    while (i < triglen) {
        let loopcond1 = asyncObj.entry.logindex > triggers[i].beforeindex;
        let loopcond2 = asyncObj.entry.logindex < triggers[i + 1].beforeindex;
        if ( loopcond1 && loopcond2 )
            return triggers[i];
        i++;
    }
    return triggers[triglen];
}

function interval(asyncObjects, relations) {
    console.log("Checking the Intervals ")
    let obj = asyncObjects.getAll().filter((o) => o.entry.type === 'Timeout');
    let i = 0 ;
    let objlen = obj.length - 1;
    while (i < objlen) {
        let  j = i + 1;
        while (j < objlen + 1) {
            if(comparingObjID(relations, obj[i], obj[j])){
                break;
            }
            j++;
        }
        i++;
    }
}
function comparingObjID(relations , obj1,obj2){
    if(obj1.entry.id === obj2.entry.id) {
        relations.add(obj1.id, obj2.id, 'interval');
        return true
    }
}

module.exports = { interval , regist }