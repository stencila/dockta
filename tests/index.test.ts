import Compiler from '../src'

test('load', async () => {
  const compiler = new Compiler()
  let node

  node = await compiler.load('FROM ubuntu', false)
  expect(node.programmingLanguage).toEqual('Dockerfile')
  expect(node.author).toEqual([])

  // Label
  node = await compiler.load('LABEL maintainer="Joe Bloggs"', false)
  expect(node.author).toEqual(['Joe Bloggs'])

  // Mutiple labels
  node = await compiler.load('LABEL maintainer="Joe Bloggs" description="My image"', false)
  expect(node.description).toEqual('My image')
  expect(node.author).toEqual(['Joe Bloggs'])

  // Mutiple labels using same key - last wins
  node = await compiler.load('LABEL maintainer="Joe Bloggs" maintainer="Peter Pan"', false)
  expect(node.author).toEqual(['Peter Pan'])

  // Muti-label with back slashes for spaces and line continuations
  node = await compiler.load('LABEL maintainer=Joe\\ Bloggs \\\ndescription="My image"', false)
  expect(node.description).toEqual('My image')
  expect(node.author).toEqual(['Joe Bloggs'])

  // Deprecated MAINTAINER directive
  node = await compiler.load('MAINTAINER Peter Pan', false)
  expect(node.author).toEqual(['Peter Pan'])

  // Using multiple MAINTAINERS does result in multiple authors
  node = await compiler.load('LABEL maintainer="Joe Bloggs"\n MAINTAINER Peter Pan\n MAINTAINER Capt Hook', false)
  expect(node.author).toEqual(['Joe Bloggs', 'Peter Pan', 'Capt Hook'])
})

test('compile', async () => {
  const compiler = new Compiler()
  let node

  jest.setTimeout(60000) // Increase timeout (in milliseconds) to allow for Docker build

  node = await compiler.load('FROM library/ubuntu@sha256:de774a3145f7ca4f0bd144c7d4ffb2931e06634f11529653b23eba85aef8e378\n')
  expect(node.messages).toEqual([])
  expect(node.id).toEqual('https://hub.docker.com/#sha256:cd6d8154f1e16e38493c3c2798977c5e142be5e5d41403ca89883840c6d51762')

  // Unknown directive (aka instruction)
  node = await compiler.load('FOO ubuntu\n')
  expect(node.messages).toEqual([{
    'type': 'SoftwareSourceCodeMessage',
    'level': 'error',
    'line': 1,
    'message': 'unknown instruction: FOO '
  }])

  // Unknown base image
  node = await compiler.load('FROM foobuntoo\n')
  expect(node.messages).toEqual([{
    'type': 'SoftwareSourceCodeMessage',
    'level': 'error',
    'message': 'pull access denied for foobuntoo, repository does not exist or may require \'docker login\''
  }])

  // Bad RUN command
  node = await compiler.load('FROM ubuntu\nRUN foo')
  expect(node.messages).toEqual([{
    'type': 'SoftwareSourceCodeMessage',
    'level': 'error',
    'message': "The command '/bin/sh -c foo' returned a non-zero code: 127"
  }])
})
