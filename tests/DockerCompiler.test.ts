import DockerCompiler from '../src/DockerCompiler'
import fixture from './fixture'
import { SoftwareEnvironment, Person } from '@stencila/schema';

/**
 * Tests of compiling Dockerfile
 * 
 * To avoid actual building of the Docker image these tests
 * set the build flag to false
 */
test('compile:dockerfile', async () => {
  const compiler = new DockerCompiler()
  let node

  node = await compiler.compile('file://' + fixture('empty'), false)
  expect(node).toEqual(new SoftwareEnvironment())

  node = await compiler.compile('file://' + fixture('dockerfile-date'), false)
  expect(node && node.description && node.description.substring(0, 23)).toEqual('Prints the current date')
  expect(node && node.authors && (node.authors[0] as Person).name).toEqual('Nokome Bentley')
})
