import Compiler from '../src'

test('load', () => {
  const compiler = new Compiler()
  let node

  node = compiler.load('FROM ubuntu')
  expect(node.programmingLanguage).toEqual('Dockerfile')
  expect(node.author).toEqual([])

  // Label
  node = compiler.load('LABEL maintainer="Joe Bloggs"')
  expect(node.author).toEqual(['Joe Bloggs'])

  // Mutiple labels
  node = compiler.load('LABEL maintainer="Joe Bloggs" description="My image"')
  expect(node.description).toEqual('My image')
  expect(node.author).toEqual(['Joe Bloggs'])

  // Mutiple labels using same key - last wins
  node = compiler.load('LABEL maintainer="Joe Bloggs" maintainer="Peter Pan"')
  expect(node.author).toEqual(['Peter Pan'])

  // Muti-label with back slashes for spaces and line continuations
  node = compiler.load('LABEL maintainer=Joe\\ Bloggs \\\ndescription="My image"')
  expect(node.description).toEqual('My image')
  expect(node.author).toEqual(['Joe Bloggs'])

  // Deprecated MAINTAINER directive
  node = compiler.load('MAINTAINER Peter Pan')
  expect(node.author).toEqual(['Peter Pan'])

  // Using multiple MAINTAINERS does result in multiple authors
  node = compiler.load('LABEL maintainer="Joe Bloggs"\n MAINTAINER Peter Pan\n MAINTAINER Capt Hook')
  expect(node.author).toEqual(['Joe Bloggs', 'Peter Pan', 'Capt Hook'])
})
