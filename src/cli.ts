#!/usr/bin/env node

// @ts-ignore
import yargonaut from 'yargonaut'
import yargs from 'yargs'
import yaml from 'js-yaml'

const VERSION = require('../package').version

import DockerCompiler from './DockerCompiler'
const compiler = new DockerCompiler()

yargonaut
  .style('blue')
  .helpStyle('green')
  .errorsStyle('red')

yargs
  .scriptName('dockter')

  .alias('h', 'help')
  .usage('$0 <cmd> [args]')

  .alias('v', 'version')
  .version(VERSION)
  .describe('version', 'Show version')

  // @ts-ignore
  .command('compile [folder] [format]', 'Compile a folder to a JSON-LD `SoftwareEnvironment` node', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The path to the folder which defines the environment'
    }),
    yargs.positional('format', {
      type: 'string',
      default: 'json',
      describe: 'Format to output the environment: json or yaml'
    })
  }, async (args: any) => {
    const node = await compiler.compile('file://' + args.folder, false).catch(error)
    output(node, args.format)
  })

  // @ts-ignore
  .command('build [folder]', 'Build a Docker image for a folder', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The path to the folder which defines the environment'
    })
  }, async (args: any) => {
    await compiler.compile('file://' + args.folder, true).catch(error)
  })

  // @ts-ignore
  .command('execute [folder] [format]', 'Execute a `SoftwareEnvironment` node', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The folder which defines the environment'
    }),
    yargs.positional('format', {
      type: 'string',
      default: 'json',
      describe: 'Format to output: json or yaml'
    })
  }, async (args: any) => {
    const node = await compiler.execute('file://' + args.folder).catch(error)
    output(node, args.format)
  })

  .parse()

function output (node: any, format: string) {
  console.log(format === 'yaml' ? yaml.safeDump(node, { lineWidth: 120 }) : JSON.stringify(node, null, '  '))
}

function error (error: Error) {
  console.error(error)
}
