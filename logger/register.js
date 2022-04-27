const fs = require('fs');
const path = require('path');

function determineUniquePathName(folder, name, extension) {
    extension = extension || '';
    let i = 1;
    let cond = fs.existsSync(path.join(folder, name + i + extension));
    while (cond){
        i++;
        cond = fs.existsSync(path.join(folder, name + i + extension))
    }
    let res = path.join(folder, name + i + extension);
    return res;
}

class Register {
    constructor(logFolder) {
        this.hrstart = process.hrtime();
        this.file = determineUniquePathName(logFolder, 'noderacer', '.log.json');
        this.entries = [];
        console.log("register.js " + this.file);
        fs.openSync(this.file, 'w');
    }

    put(entry) {
        let self = this;
        let cond = (entry.e === 'start-new-test-case');
        if (cond) {
            if (!self.testCaseMode) {  // first test case
                self.testCaseMode = {
                    preamble_init: 0,
                    preamble_end: self.entries.length - 2,
                    tests: []
                };
            }

            self.testCaseMode.tests.push({
                name: entry.testCaseName,
                file: entry.testCaseFile,
                begin: self.entries.length + 2
            });
        }
        this.entries.push(entry);
    }

    dump() {
        let self = this;

        console.log("For register.js " + self.entries.length);
        fs.appendFileSync(self.file, JSON.stringify({
            runtime: process.hrtime(self.hrstart)[1] / 1000000,
            entries: self.entries
        }, null, 4), 'utf-8');
    }
}

module.exports = Register