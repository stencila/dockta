import DockerCompiler from '../src/DockerCompiler'
import fixture from './fixture'
import { SoftwareEnvironment } from '../src/context';

jest.setTimeout(60000) // Increase timeout (in milliseconds) to allow for Docker builds

/**
 * Tests of compiling Dockerfile
 */
test('compile:dockerfile', async () => {
  const compiler = new DockerCompiler()
  let node

  //node = await compiler.compile('file://' + fixture('empty'))
  //expect(node.text).toEqual('FROM ubuntu:bionic\n')

  //node = await compiler.compile('file://' + fixture('dockerfile-date'))
  //expect(node.text).toEqual('')

  node = await compiler.compile('file://' + fixture('r-date'))
})

/**
 * Tests of building Docker image during compilation
 */
test.skip('compile:build', async () => {
  const compiler = new DockerCompiler()
  let node

  node = await compiler.compile('FROM library/ubuntu@sha256:de774a3145f7ca4f0bd144c7d4ffb2931e06634f11529653b23eba85aef8e378\n')
  //expect(node.messages).toEqual([])
  //expect(node.id).toEqual('https://hub.docker.com/#sha256:cd6d8154f1e16e38493c3c2798977c5e142be5e5d41403ca89883840c6d51762')

  // Unknown directive (aka instruction)
  node = await compiler.compile('FOO ubuntu\n')
  //expect(node.messages[0].line).toEqual(1)
  //expect(node.messages[0].message).toEqual('unknown instruction: FOO ')

  // Unknown base image
  node = await compiler.compile('FROM foobuntoo\n')
  //expect(node.messages[0].message).toEqual('pull access denied for foobuntoo, repository does not exist or may require \'docker login\'')

  // Bad RUN command
  node = await compiler.compile('FROM ubuntu\nRUN foo')
  //expect(node.messages[0].message).toEqual("The command '/bin/sh -c foo' returned a non-zero code: 127")
})

/**
 * Tests of execution
 */
test.skip('execute', async () => {
  const compiler = new DockerCompiler()
  let node

  // Compile from file
  node = await compiler.execute('file://tests/fixtures/dockerfile-date') as SoftwareEnvironment
  //expect(node.description.substring(0, 23)).toEqual('Prints the current date')
  //expect((node.authors[0] as Person).name).toEqual('Nokome Bentley')
  //expect((node.authors[0] as Person).emails[0]).toEqual('nokome@stenci.la')
})
