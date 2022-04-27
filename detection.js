const fs = require('fs');

const getrep = require('./hb').getReport;
const readlogs = require('../log').read;

function detector(getr, logre) {
    
    let logs = readHBfile(readlogs);
    let report = getReport(getrep);

    console.log(`callbacks: ${report[0]}`);
    console.log(`h-b relations: ${report[1]}`);
    if (!fs.checkViolation(logs))
        throw 'There is no Violation.';
    if (report)
        throw 'Atomic Violation Exists.';

}

module.exports = detector;