import * as path from 'path'
import nix from './cli-nix'
import yaml from 'js-yaml'
import DockerCompiler from './DockerCompiler'
import CachingUrlFetcher from './CachingUrlFetcher'
import { ApplicationError } from './errors'
import * as logga from '@stencila/logga'

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
 * Convert an object to a string (maybe to go to stdout or back over HTTP)
 *
 * @param object The object to print
 * @param format The format use: `json` or `yaml`
 */
function stringifyNode (object: any, format: string): string {
  if (!object) {
    return ''
  }

  return format === 'yaml' ? yaml.safeDump(object, { lineWidth: 120 }) : JSON.stringify(object, null, '  ')
}

/**
 * Compile a folder to an environment, optionally with nix too.
 *
 * @param folder Path of the folder to compile
 * @param useNix Compile the environment for nix
 */
export async function compile (folder: string, useNix: boolean, addStencila: boolean, from?: string) {
  const absoluteFolder = path.resolve(folder)
  const comments = true
  const build = false
  let environ = await compiler.compile('file://' + absoluteFolder, build, comments, addStencila, from).catch(loggingErrorHandler)
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
export async function build (folder: string, useNix: boolean, addStencila: boolean, from?: string) {
  const absoluteFolder = path.resolve(folder)

  if (useNix) {
    await nix.build(absoluteFolder)
  } else {
    const comments = true
    const build = true
    compiler.compile(absoluteFolder, build, comments, addStencila, from).catch(loggingErrorHandler)
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
 * @param outputFunction Optional callback to receive the output. If undefined, node output goes to stdout.
 */
export async function execute (folder: string, command: string, useNix: boolean, outputFormat: string = 'json', outputFunction: Function = console.log) {
  const absoluteFolder = path.resolve(folder)

  if (useNix) {
    await nix.execute(absoluteFolder, command)
  } else {
    const node = await compiler.execute('file://' + absoluteFolder, command).catch(loggingErrorHandler)
    const nodeString = stringifyNode(node, outputFormat)

    outputFunction(nodeString)
  }
}

/**
 * List the people your project depends upon.
 *
 * @param folder Path of folder to examine
 * @param depth Maximum depth of dependencies to traverse to find people
 * @param outputFunction Optional callback to receive the output. If undefined, utput goes to stdout.
 */
export async function who (folder: string, depth: number = 100, outputFunction: Function = console.log) {
  const absoluteFolder = path.resolve(folder)
  const people = await compiler.who('file://' + absoluteFolder, depth).catch(loggingErrorHandler)

  if (!people) {
    outputFunction('Nobody (?)')
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
    outputFunction(output)
  }
}
