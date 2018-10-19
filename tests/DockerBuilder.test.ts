import DockerBuilder from '../src/DockerBuilder'
import fixture from './fixture'

// This is intended to be the only test file where we do any actual Docker image builds
// Increase timeout (in milliseconds) to allow for Docker builds
jest.setTimeout(30 * 60 * 1000)

/**
 * When applied to a Dockerfile with a # dockter comment
 * should produce a staged build
 */
test('build:py-requests-dockter', async () => {
  const builder = new DockerBuilder()

  await builder.build(fixture('py-requests-dockter'))
})

/**
 * When applied to a Dockerfile *without* a # dockter comment
 * should act just like Docker build
 */
test('build:py-requests-no-dockter', async () => {
  const builder = new DockerBuilder()

  await builder.build(fixture('py-requests-no-dockter'))
})

/**
 * Tests of build failiures
 * 
 * Currently skipped because we are not handline messages right now
 */
test.skip('build:py-requests-no-dockter', async () => {
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
