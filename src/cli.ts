#!/usr/bin/env node

import os from 'os'
// @ts-ignore
import yargonaut from 'yargonaut'
import yargs from 'yargs'
import { ApplicationError } from './errors'
import nix from './cli-nix'
import { build, compile, execute, who } from './index'

const VERSION = require('../package').version

yargonaut
  .style('blue')
  .helpStyle('green')
  .errorsStyle('red')

yargs
  .scriptName('dockta')

  // Help global option
  .alias('h', 'help')
  .usage('$0 <cmd> [args]')

  // Version global option
  .alias('v', 'version')
  .version(VERSION)
  .describe('version', 'Show version')

  // Nix global option
  .option('nix', {
    describe: 'Use NixOS base image',
    type: 'boolean'
  })
  .option('from', {
    describe: 'The base docker image to inherit FROM'
  })
  .option('stencila', {
    describe: 'Add stencila execution hosts',
    default: false,
    type: 'boolean'
  })

  // Ensure at least one command
  .demandCommand(1, 'Please provide a command.')
  // Provide suggestions regarding similar commands if no matching command is found
  .recommendCommands()
  // Any command-line argument given that is not demanded, or does not have a corresponding description, will be reported as an error.
  // Unrecognized commands will also be reported as errors.
  .strict()

  // Compile command
  // @ts-ignore
  .command(
    'compile [folder]',
    'Compile a project to a software environment',
    yargs => {
      folderArg(yargs)
    },
    (args: any) => {
      compile(args.folder, args.nix, args.stencila, args.from).catch(err =>
        error(err)
      )
    }
  )

  // Build command
  // @ts-ignore
  .command(
    'build [folder]',
    'Build a Docker image for project',
    yargs => {
      folderArg(yargs)
    },
    (args: any) => {
      build(args.folder, args.nix, args.stencila, args.from).catch(err =>
        error(err)
      )
    }
  )

  // Execute command
  // @ts-ignore
  .command(
    'execute [folder] [command]',
    'Execute a project',
    yargs => {
      folderArg(yargs)
      yargs.positional('command', {
        type: 'string',
        default: '',
        describe: 'The command to execute'
      })
    },
    (args: any) => {
      execute(args.folder, args.command, args.nix).catch(err => error(err))
    }
  )

  // Who command
  // @ts-ignore
  .command(
    'who [folder]',
    'List the people your project depends upon',
    yargs => {
      folderArg(yargs)
      yargs.option('depth', {
        alias: 'd',
        type: 'number',
        default: 100,
        describe: 'The maximum dependency recursion depth'
      })
    },
    (args: any) => {
      who(args.folder, args.depth).catch(err => error(err))
    }
  )
  .parse()

/**
 * Specify the [folder] argument settings
 *
 * @param yargs The yargs object
 */
function folderArg(yargs: yargs.Argv) {
  yargs.positional('folder', {
    type: 'string',
    default: '.',
    describe: 'The path to the project folder'
  })
}

/**
 * Print an error to stderr
 *
 * @param error The error to print
 */
function error(error: Error) {
  if (error instanceof ApplicationError) {
    console.error(error.message)
  } else {
    console.error('Woops, sorry something went wrong :(')
    console.error(
      'Please help us fix this issue by posting this output to https://github.com/stencila/dockta/issues/new'
    )
    console.error(`  args: ${process.argv.slice(2).join(' ')}`)
    console.error(`  version: ${VERSION}`)
    console.error(`  platform: ${os.platform()}`)
    console.error(error)
    process.exit(1)
  }
}
