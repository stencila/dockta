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

  // Help global option
  .alias('h', 'help')
  .usage('$0 <cmd> [args]')

  // Version global option
  .alias('v', 'version')
  .version(VERSION)
  .describe('version', 'Show version')

  // Ensure at least one command
  .demandCommand(1, 'Please provide a command.')
  // Provide suggestions regarding similar commands if no matching command is found
  .recommendCommands()
  // Any command-line argument given that is not demanded, or does not have a corresponding description, will be reported as an error.
  // Unrecognized commands will also be reported as errors.
  .strict()

  // Compile command
  // @ts-ignore
  .command('compile [folder] [format]', 'Compile a project to a software environment', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The path to the project folder'
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

  // Build command
  // @ts-ignore
  .command('build [folder]', 'Build a Docker image for project', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The path to the project folder'
    })
  }, async (args: any) => {
    await compiler.compile('file://' + args.folder, true).catch(error)
  })

  // Execute command
  // @ts-ignore
  .command('execute [folder] [format]', 'Execute a project', yargs => {
    yargs.positional('folder', {
      type: 'string',
      default: '.',
      describe: 'The path to the project folder'
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
