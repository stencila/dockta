import DockerParser from '../src/DockerParser'
import {Person, SoftwareEnvironment} from '../src/context'
import fixture from './fixture'

/**
 * When passed Dockerfile strings, parse should extract LABEL
 * and MAINTAINER instructions.
 */
test('parse:strings', async () => {
  const parser = new DockerParser('')
  let environ

  environ = await parser.parse('FROM ubuntu') as SoftwareEnvironment
  expect(environ.authors).toEqual([])

  // Single label
  environ = await parser.parse('LABEL maintainer="Joe Bloggs <joe@bloggs.com> (https://bloggs.com/joe)"') as SoftwareEnvironment
  expect(environ.authors[0].name).toEqual('Joe Bloggs')
  const author = environ.authors[0] as Person
  expect(author.givenNames[0]).toEqual('Joe')
  expect(author.familyNames[0]).toEqual('Bloggs')
  expect(author.emails[0]).toEqual('joe@bloggs.com')
  expect(author.urls[0]).toEqual('https://bloggs.com/joe')

  // Mutiple labels
  environ = await parser.parse('LABEL maintainer="Joe Bloggs" description="My image"') as SoftwareEnvironment
  expect(environ.description).toEqual('My image')
  expect(environ.authors[0].name).toEqual('Joe Bloggs')

  // Mutiple labels using same key - last wins
  environ = await parser.parse('LABEL maintainer="Joe Bloggs" maintainer="Peter Pan"') as SoftwareEnvironment
  expect(environ.authors[0].name).toEqual('Peter Pan')

  // Muti-label with back slashes for spaces and line continuations
  environ = await parser.parse('LABEL maintainer=Joe\\ Bloggs \\\ndescription="My image"') as SoftwareEnvironment
  expect(environ.description).toEqual('My image')
  expect(environ.authors[0].name).toEqual('Joe Bloggs')

  // Deprecated MAINTAINER instruction
  environ = await parser.parse('MAINTAINER Peter Pan') as SoftwareEnvironment
  expect(environ.authors[0].name).toEqual('Peter Pan')

  // Using multiple MAINTAINERS does result in multiple authors
  environ = await parser.parse('LABEL maintainer="Joe Bloggs"\n MAINTAINER Peter Pan\n MAINTAINER Capt Hook')  as SoftwareEnvironment
  expect(environ.authors.length).toEqual(3)
  expect(environ.authors[0].name).toEqual('Joe Bloggs')
  expect(environ.authors[1].name).toEqual('Peter Pan')
  expect(environ.authors[2].name).toEqual('Capt Hook')
})

/**
 * When applied to an empty folder, parse should return null.
 */
test('parse:empty', async () => {
  const parser = new DockerParser(fixture('empty'))
  expect(await parser.parse()).toBeNull()
})

/**
 * When applied to a folder without a Dockerfile, parse should return null.
 */
test('parse:r-date', async () => {
  const parser = new DockerParser(fixture('r-date'))
  expect(await parser.parse()).toBeNull()
})

/**
 * When applied to a folder with a Dockerfile, parse should return a
 * `SoftwareEnvironment` based upon it.
 */
test('parse:dockerfile-date', async () => {
  const parser = new DockerParser(fixture('dockerfile-date'))
  const environ = await parser.parse() as SoftwareEnvironment
  expect(environ.description.substring(0, 23)).toEqual('Prints the current date')
  expect(environ.authors[0].name).toEqual('Nokome Bentley')
  expect((environ.authors[0] as Person).emails[0]).toEqual('nokome@stenci.la')
})
