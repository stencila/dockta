import Compiler from '../src'

test('load', () => {
  const compiler = new Compiler()
  let node

  node = compiler.load('FROM ubuntu')
  expect(node.programmingLanguage).toEqual('Dockerfile')
  expect(node.author).toEqual([])

  node = compiler.load('LABEL maintainer="Joe Bloggs"')
  expect(node.author).toEqual(['Joe Bloggs'])

  node = compiler.load('MAINTAINER Peter Pan')
  expect(node.author).toEqual(['Peter Pan'])

  node = compiler.load('LABEL maintainer="Joe Bloggs"\n MAINTAINER Peter Pan')
  expect(node.author).toEqual(['Joe Bloggs', 'Peter Pan'])
})
