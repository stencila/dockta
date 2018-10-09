import Builder from '../src/Builder'
import fixture from './fixture'

test('build', async () => {
  const builder = new Builder()

  await builder.build(fixture('py-date'), 'dockter-test-py-date')
})
