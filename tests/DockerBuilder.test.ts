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

  await builder.build(fixture('py-requests-dockter'), 'dockter-test-py-requests-dockter')
})

/**
 * When applied to a Dockerfile *without* a # dockter comment
 * should act just like Docker build
 */
test('build:py-requests-no-dockter', async () => {
  const builder = new DockerBuilder()

  await builder.build(fixture('py-requests-no-dockter'), 'dockter-test-py-requests-no-dockter')
})
