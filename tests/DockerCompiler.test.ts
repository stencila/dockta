import fs from 'fs'

import DockerCompiler from '../src/DockerCompiler'
import fixture from './fixture'
import { SoftwareEnvironment, Person } from '@stencila/schema';

/**
 * To avoid actual building of the Docker image these tests
 * set the build flag to false
 */

test('compile:empty', async () => {
  const compiler = new DockerCompiler()
  let environ = await compiler.compile('file://' + fixture('empty'), false)

  expect(environ).toEqual(new SoftwareEnvironment())
})

test('compile:dockerfile-date', async () => {
  const compiler = new DockerCompiler()
  let environ = await compiler.compile('file://' + fixture('dockerfile-date'), false)

  expect(environ && environ.description && environ.description.substring(0, 23)).toEqual('Prints the current date')
  expect(environ && environ.authors && (environ.authors[0] as Person).name).toEqual('Nokome Bentley')
})

test('compile:multi-lang', async () => {
  const compiler = new DockerCompiler()
  let environ = await compiler.compile('file://' + fixture('multi-lang'), false, false)

  const actual = fs.readFileSync(fixture('multi-lang/.Dockerfile'), 'utf8')
  const expected = fs.readFileSync(fixture('multi-lang/.Dockerfile.expected'), 'utf8')
  expect(actual).toEqual(expected)
})
