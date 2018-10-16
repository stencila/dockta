import DockerBuilder from '../src/DockerBuilder'
import fixture from './fixture'

jest.setTimeout(30 * 60 * 1000) // Increase timeout (in milliseconds) to allow for Docker builds

/**
 * When applied to a Dockerfile with a # dockter comment
 * should produce a staged build
 */
test.skip('build:py-requests', async () => {
  const builder = new DockerBuilder()

  await builder.build(fixture('py-requests-dockter'), 'dockter-test-py-requests-dockter')
})

/**
 * When applied to a Dockerfile *without* a # dockter comment
 * should act just like Docker build
 */
test('build:py-requests', async () => {
  const builder = new DockerBuilder()

  await builder.build(fixture('py-requests-no-dockter'), 'dockter-test-py-requests-no-dockter')
})
