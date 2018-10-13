import DockerGenerator from '../src/DockerGenerator'

test('generate', () => {
  const generator = new DockerGenerator()

  expect(generator.generate({})).toEqual(`
FROM ubuntu:18.04

# dockter
`)
})
