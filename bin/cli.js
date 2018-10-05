#!/usr/bin/env node

const yargs = require('yargs')
const yaml = require('js-yaml')

const Compiler = require('../dist').default
const compiler = new Compiler()

yargs
  .usage('$0 <cmd> [args]')
  .command('compile [path] [build] [format]', 'Compile a file or folder to a JSON-LD `SoftwareEnvironment` node', yargs => {
    yargs.positional('path', {
      type: 'string',
      default: '.',
      describe: 'The path to the file or folder which defines the environment'
    }),
    yargs.positional('build', {
      type: 'boolean',
      default: true,
      describe: 'Build a Docker image for the environment'
    }),
    yargs.positional('format', {
      type: 'string',
      default: 'json',
      describe: 'Format to output: json or yaml'
    })
  }, async args => {
    output(await compiler.compile('file://' + args.path, args.build).catch(error), args.format)
  })
  .parse()

function output (node, format) {
  console.log(format === 'yaml' ? yaml.safeDump(node, {lineWidth: 120}) : JSON.stringify(node, null, '  '))
}

function error (error) {
  console.error(error)
}
