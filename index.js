#!/usr/bin/env node

const logwrapper = require.resolve('./logger/wrapping.js');
const hbIdentifier = require('./hb/checking');

const foreground = require('foreground-child');
const sw = require('spawn-wrap');
const path = require('path');
const argv = require('yargs');
const sanitize = require('string-sanitizer').sanitize;

argv
    .usage('Usage: $0 <command> [options]')
    .command('log <testcommand>', 'run the test and log its trace (observation)', (yargs) => {
        return yargs.option('config', {
            alias: 'c',
            describe: 'path to the config file',
            nargs: 1
        });
    }, (argv) => {
        let originalCommand = process.argv.slice(3);
        if (argv.config) {
            originalCommand.pop();
            originalCommand.pop();
        }
        
        sw([logwrapper], {
            
            LOG_FOLDER: buildLogFolderPath(originalCommand),
            COMMAND: originalCommand,
            CONFIGFILE: argv.config && path.resolve(argv.config)
        });
        foreground(originalCommand, (done) => {
            console.log("--");
            return done();
        });
    })

    .command('hb <pathtologfile>', 'identify happens-before relations', (yargs) => {
        return yargs
            .option('image', { alias: 'i' })
            .option('noglobal', { alias: 'ng' });
    }, (argv) => {
        hbIdentifier({
            file: argv.pathtologfile,
            image: argv.image || false,
            noglobal: argv.noglobal || false
        });
    })
    .argv;

if (process.argv.length <= 2)
    argv.showHelp();

function buildLogFolderPath(command) {
    let specName = command.join('_').split('/').join('_').split('.').join('_');
    specName = sanitize(specName);

    if (specName.length > 100)
        specName = specName.substring(0, 20);

    return path.join(process.cwd(), 'log', specName);
}