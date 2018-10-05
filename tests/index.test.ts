import Compiler from '../src'

/**
 * Tests of extracting meta-data during compilation
 */
test('compile:meta-data', async () => {
  const compiler = new Compiler()
  let node

  node = await compiler.compile('FROM ubuntu', false)
  expect(node.programmingLanguage).toEqual('Dockerfile')
  expect(node.author).toEqual([])

  // Label
  node = await compiler.compile('LABEL maintainer="Joe Bloggs <joe@bloggs.com> (https://bloggs.com/joe)"', false)
  expect(node.author[0].name[0]).toEqual('Joe Bloggs')
  expect(node.author[0].givenName[0]).toEqual('Joe')
  expect(node.author[0].familyName[0]).toEqual('Bloggs')
  expect(node.author[0].email[0]).toEqual('joe@bloggs.com')
  expect(node.author[0].url[0]).toEqual('https://bloggs.com/joe')

  // Mutiple labels
  node = await compiler.compile('LABEL maintainer="Joe Bloggs" description="My image"', false)
  expect(node.description[0]).toEqual('My image')
  expect(node.author[0].name[0]).toEqual('Joe Bloggs')

  // Mutiple labels using same key - last wins
  node = await compiler.compile('LABEL maintainer="Joe Bloggs" maintainer="Peter Pan"', false)
  expect(node.author[0].name[0]).toEqual('Peter Pan')

  // Muti-label with back slashes for spaces and line continuations
  node = await compiler.compile('LABEL maintainer=Joe\\ Bloggs \\\ndescription="My image"', false)
  expect(node.description[0]).toEqual('My image')
  expect(node.author[0].name[0]).toEqual('Joe Bloggs')

  // Deprecated MAINTAINER directive
  node = await compiler.compile('MAINTAINER Peter Pan', false)
  expect(node.author[0].name[0]).toEqual('Peter Pan')

  // Using multiple MAINTAINERS does result in multiple authors
  node = await compiler.compile('LABEL maintainer="Joe Bloggs"\n MAINTAINER Peter Pan\n MAINTAINER Capt Hook', false)
  expect(node.author.length).toEqual(3)
  expect(node.author[0].name[0]).toEqual('Joe Bloggs')
  expect(node.author[1].name[0]).toEqual('Peter Pan')
  expect(node.author[2].name[0]).toEqual('Capt Hook')

  // Compile from file
  node = await compiler.compile('file://tests/fixtures/dockerfile-date/Dockerfile', false)
  expect(node.description[0].substring(0, 23)).toEqual('Prints the current date')
  expect(node.author[0].name[0]).toEqual('Nokome Bentley')
  expect(node.author[0].email[0]).toEqual('nokome@stenci.la')
})

/**
 * Tests of building Docker image during compilation
 */
test('compile:build', async () => {
  const compiler = new Compiler()
  let node

  jest.setTimeout(60000) // Increase timeout (in milliseconds) to allow for Docker build

  node = await compiler.compile('FROM library/ubuntu@sha256:de774a3145f7ca4f0bd144c7d4ffb2931e06634f11529653b23eba85aef8e378\n')
  expect(node.messages).toEqual([])
  expect(node.id).toEqual('https://hub.docker.com/#sha256:cd6d8154f1e16e38493c3c2798977c5e142be5e5d41403ca89883840c6d51762')

  // Unknown directive (aka instruction)
  node = await compiler.compile('FOO ubuntu\n')
  expect(node.messages[0].line).toEqual(1)
  expect(node.messages[0].message).toEqual('unknown instruction: FOO ')

  // Unknown base image
  node = await compiler.compile('FROM foobuntoo\n')
  expect(node.messages[0].message).toEqual('pull access denied for foobuntoo, repository does not exist or may require \'docker login\'')

  // Bad RUN command
  node = await compiler.compile('FROM ubuntu\nRUN foo')
  expect(node.messages[0].message).toEqual("The command '/bin/sh -c foo' returned a non-zero code: 127")
})
