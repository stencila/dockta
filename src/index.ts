import * as path from 'path'
import nix from './cli-nix'
import DockerCompiler from './DockerCompiler'
import CachingUrlFetcher from './CachingUrlFetcher'
import { ApplicationError } from './errors'
import * as logga from '@stencila/logga'
import { output } from './output'

const compiler = new DockerCompiler(new CachingUrlFetcher())

const logger = logga.getLogger('dockta')

/**
 * Log an error to logga
 *
 * @param error
 */
function loggingErrorHandler (error: Error) {
  if (error instanceof ApplicationError) {
    logger.error(error.message)
  } else {
    logger.error(error)
  }
}

/**
 * Compile a folder to an environment, optionally with nix too.
 *
 * @param folder Path of the folder to compile
 * @param useNix Compile the environment for nix
 */
export async function compile (folder: string, useNix: boolean) {
  const absoluteFolder = path.resolve(folder)
  let environ = await compiler.compile('file://' + absoluteFolder, false).catch(loggingErrorHandler)
  if (useNix) {
    nix.compile(environ, folder)
  }
}

/**
 * Build an environment from a folder, optionally using nix.
 *
 * @param folder Path of the folder to build
 * @param useNix Build the environment with nix
 */
export async function build (folder: string, useNix: boolean) {
  const absoluteFolder = path.resolve(folder)

  if (useNix) {
    await nix.build(absoluteFolder)
  } else {
    compiler.compile(absoluteFolder).catch(loggingErrorHandler)
  }
}

/**
 * Execute a command inside a folder, by first building the environment inside that folder.
 * If the environment has already been built it will not be rebuilt.
 *
 * @param folder Path of folder to build into environment
 * @param command The command to execute
 * @param useNix Build the environment with nix
 * @param outputFormat The format to output as ('json' or 'yaml')
 */
export async function execute (folder: string, command: string, useNix: boolean, outputFormat: string = 'json') {
  const absoluteFolder = path.resolve(folder)

  if (useNix) {
    await nix.execute(absoluteFolder, command)
  } else {
    const node = await compiler.execute('file://' + absoluteFolder, command).catch(loggingErrorHandler)
    output(node, outputFormat)
  }
}

/**
 * List the people your project depends upon.
 *
 * @param folder Path of folder to examine
 * @param depth Maximum depth of dependencies to traverse to find people
 */
export async function who (folder: string, depth: number = 100) {
  const absoluteFolder = path.resolve(folder)
  const people = await compiler.who('file://' + absoluteFolder, depth).catch(loggingErrorHandler)

  if (!people) {
    console.log('Nobody (?)')
  } else {
    // Sort by number of packages descending and then alphabetically ascending
    let sorted = Object.entries(people).sort(([aName, aPkgs], [bName, bPkgs]) => {
      if (aPkgs.length > bPkgs.length) return -1
      if (aPkgs.length < bPkgs.length) return 1
      if (aName < bName) return -1
      if (aName > bName) return 1
      return 0
    })
    // Output in a CLI friendly way
    const output = sorted.map(([name, packages]) => {
      return `${name} (${packages.join(', ')})`
    }).join(', ')
    console.log(output)
  }
}
