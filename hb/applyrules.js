const {interval, regist} = require('./rules/registration');
const fiforule = require('./rules/fifo');
const {promiseAll , promiseIndi} = require('./rules/promises');
const globalRules = require('./rules/global_fifo');

function applyHbRules(entries, asyncObjects, relations, opts) {
    let defaultOpts = {
        registration: true,
        promises: true,
        fifoByType: true,
        fifoByTimeout: true,
        interval: true,
        promiseAll: true,
        promiseRace: true,
        global: true
    };
    opts = { ...defaultOpts, ...opts };

    if (opts.registration)
        regist(entries, asyncObjects, relations);
        
    if (opts.promises)
        promiseIndi(entries, asyncObjects, relations);

    if (opts.fifoByType)
        fiforule.applyfifobytimeout(entries, asyncObjects, relations);

    if (opts.fifoByTimeout)
        fiforule.applyfifobytype(entries, asyncObjects, relations);

    if (opts.interval)
        interval(asyncObjects, relations);

    if (opts.promiseAll)
        promiseAll(entries, asyncObjects, relations);

    if (opts.global)
        globalRules.globalfifo(entries, asyncObjects, relations);

}

module.exports = applyHbRules;