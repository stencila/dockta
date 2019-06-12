import Docker from 'dockerode'

import DockerBuilder from '../src/DockerBuilder'
import { fixture } from './test-functions'

// This is intended to be the only test file where we do any actual Docker image builds
// Increase timeout (in milliseconds) to allow for Docker builds
jest.setTimeout(30 * 60 * 1000)

/**
 * When applied to a Dockerfile with a # dockta comment
 * should produce a staged build
 */
test('build:py-requests-dockta', async () => {
  const builder = new DockerBuilder()
  const docker = new Docker()

  // Remove any existing images
  try {
    await docker.getImage('py-requests-dockta:latest').remove()
  } catch (error) {
    if (!error.message.includes('No such image')) throw error
  }

  // Build it
  await builder.build(fixture('py-requests-dockta'), 'py-requests-dockta')

  // Get info for expectations
  const latest = docker.getImage('py-requests-dockta:latest')
  const history = await latest.history()
  const latestInfo = await latest.inspect()
  const system = docker.getImage('py-requests-dockta:system')
  const systemInfo = await system.inspect()
  
  expect(history[0].Comment).toEqual('Updated application layer')
  expect(history[0].Size).toBeGreaterThan(0)
  // TODO : add more expectations!
})

/**
 * When applied to a Dockerfile *without* a # dockta comment
 * should act just like Docker build
 */
test('build:py-requests-no-dockta', async () => {
  const builder = new DockerBuilder()
  const docker = new Docker()
  
  // Remove any existing images
  try {
    await docker.getImage('py-requests-no-dockta:latest').remove()
  } catch (error) {
    if (!error.message.includes('No such image')) throw error
  }

  // Build it
  await builder.build(fixture('py-requests-no-dockta'), 'py-requests-no-dockta')

  // Get info for expectations
  const latest = docker.getImage('py-requests-no-dockta:latest')
  const history = await latest.history()
  const latestInfo = await latest.inspect()
  const system = docker.getImage('py-requests-no-dockta:system')
  const systemInfo = await system.inspect()
  
  expect(history[0].Comment).toEqual('No updates requested')
  expect(history[0].Size).toEqual(0)
  // TODO : add more expectations!
})

/**
 * Tests of build failures
 * 
 * Currently skipped because we are not handling messages right now
 */
test.skip('build:py-requests-no-dockta', async () => {
  const builder = new DockerBuilder()
  let node

  // Unknown directive (aka instruction)
  node = await builder.build('FOO ubuntu\n')
  //expect(node.messages[0].line).toEqual(1)
  //expect(node.messages[0].message).toEqual('unknown instruction: FOO ')

  // Unknown base image
  node = await builder.build('FROM foobuntoo\n')
  //expect(node.messages[0].message).toEqual('pull access denied for foobuntoo, repository does not exist or may require \'docker login\'')

  // Bad RUN command
  node = await builder.build('FROM ubuntu\nRUN foo')
  //expect(node.messages[0].message).toEqual("The command '/bin/sh -c foo' returned a non-zero code: 127")
})
