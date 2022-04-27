const async_hooks = require('async_hooks');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Register = require('./register');
const util = require('util');
const hasha = require('hasha');

function generateId(inp) {
    if(!inp)
        return "EMPTY";
    let inplen = inp.length;
    if(inplen === 0)
        return "EMPTY";

    let raw = "";
    inp.forEach(e => {
        if(e != null)
            raw += util.inspect(e);
    });
    if(raw === "")
        return "EMPTY";
    return hasha(raw);
}
function writetoFile (configFile, command, logFolder){
    let tfiles = ['**/*.js', '!**/node_modules/**'];
    tfiles.push('!' + command.split(',')[1]); //do not track the test file
    if (configFile) {
        let config = JSON.parse(fs.readFileSync(configFile));
        tfiles = config.pattern || ['**/*.js', '!**/node_modules/**'];
        if (!config.testfile)
            tfiles.push('!' + command.split(',')[1]); //do not track the test file

        fs.writeFileSync(path.join(logFolder, 'settings.json'), JSON.stringify(tfiles, null, 4), 'utf-8');
    }
    return tfiles;
}
function creatingHook(register){
    
    function before(asyncId) {
        register.put({
            e: 'AsyncHook-before',
            id: asyncId,
            trigger: async_hooks.triggerAsyncId(),
            current: async_hooks.executionAsyncId()
        });
    }

    function init(asyncId, type, triggerAsyncId, resource) {
        let entry = {
            e: 'AsyncHook-init',
            id: asyncId,
            trigger: triggerAsyncId,
            type: type,
            current: async_hooks.executionAsyncId()
        };

        if (type === 'Timeout')
            entry.timeout = resource._idleTimeout;

        register.put(entry);
    }

    function promiseResolve(asyncId) {
        register.put({
            e: 'AsyncHook-promiseResolve',
            id: asyncId,
            trigger: async_hooks.triggerAsyncId(),
            current: async_hooks.executionAsyncId()
        });
    }

    const asyncHook = async_hooks.createHook({ init, before, promiseResolve });
    asyncHook.enable();
    return asyncHook
}
function logger(logFolder, command, configFile) {
    let cond =  !fs.existsSync(configFile);
    if (configFile && cond)
        throw 'configuration file does not exist';
    let cond2 = !fs.existsSync(logFolder);
    if (cond2) {
        mkdirp.sync(logFolder);
    }
    let register = new Register(logFolder);
    process.on('exit', () => { register.dump() });

    var Formatter = require('../njstrace/lib/formatter');
    function MyFormatter() { }
    require('util').inherits(MyFormatter, Formatter);

    MyFormatter.prototype.onEntry = function (args) {
        register.put({
            e: 'call-entry',
            current: async_hooks.executionAsyncId(),
            trigger: async_hooks.triggerAsyncId(),
            function: args.name,
            file: args.file,
            line: args.line,
            args: generateId(args.args)
        });
    };

    MyFormatter.prototype.onExit = function (args) {
        register.put({
            e: 'call-exit',
            current: async_hooks.executionAsyncId(),
            trigger: async_hooks.triggerAsyncId(),
            function: args.name,
            file: args.file,
            line: args.line
        });
    };

    let tfiles = writetoFile(configFile, command, logFolder)

    require('../njstrace').inject({
        formatter: new MyFormatter(),
        files: tfiles
    });

    /*----------------------------------------------------------------------------------------
        ASYNC HOOKS
    ----------------------------------------------------------------------------------------
    */
    let asyncHook = creatingHook(register);
    let _PromiseAll = Promise.all;
    Promise.all = function () {
        register.put({
            e: 'promise-all-begin',
            current: async_hooks.executionAsyncId(),
            trigger: async_hooks.triggerAsyncId()
        });

        let ret = _PromiseAll.apply(this, arguments);

        register.put({
            e: 'promise-all-end',
            current: async_hooks.executionAsyncId(),
            trigger: async_hooks.triggerAsyncId()
        });

        return ret;
    };

    let _PromiseRace = Promise.race;
    Promise.race = function () {
        register.put({
            e: 'promise-race-begin',
            current: async_hooks.executionAsyncId(),
            trigger: async_hooks.triggerAsyncId()
        });

        let ret = _PromiseRace.apply(this, arguments);

        register.put({
            e: 'promise-race-end',
            current: async_hooks.executionAsyncId(),
            trigger: async_hooks.triggerAsyncId()
        });

        return ret;
    };

    global.NR_MARK_STARTING_NEW_TC = function (testCaseName, testCaseFile) {
        register.put({
            e: 'start-new-test-case',
            testCaseName,
            testCaseFile
        });
    };
}


module.exports = logger