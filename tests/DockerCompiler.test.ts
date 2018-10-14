import Compiler from '../src/DockerCompiler'
import fixture from './fixture'

/**
 * Tests of compiling Dockerfile
 */
test('compile:dockerfile', async () => {
  const compiler = new Compiler()
  let node

  node = await compiler.compile('file://' + fixture('empty'), false)
  //expect(node.text).toEqual('FROM ubuntu:bionic\n')

  node = await compiler.compile('file://' + fixture('dockerfile-date'), false)
  //expect(node.text).toEqual('')
})

/**
 * Tests of building Docker image during compilation
 */
test.skip('compile:build', async () => {
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

/**
 * Tests of execution
 */
test.skip('execute', async () => {
  const compiler = new Compiler()
  let node

  jest.setTimeout(60000) // Increase timeout (in milliseconds) to allow for Docker build

  // Compile from file
  node = await compiler.execute('file://tests/fixtures/dockerfile-date')
  expect(node.description[0].substring(0, 23)).toEqual('Prints the current date')
  expect(node.author[0].name[0]).toEqual('Nokome Bentley')
  expect(node.author[0].email[0]).toEqual('nokome@stenci.la')
})
