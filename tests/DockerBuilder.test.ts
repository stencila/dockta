import DockerBuilder from '../src/DockerBuilder'
import fixture from './fixture'

test('build', async () => {
  const builder = new DockerBuilder()

  await builder.build(fixture('py-date'), 'dockter-test-py-date')
})
