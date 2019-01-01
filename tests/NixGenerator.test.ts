import fs from 'fs'
import path from 'path'
import DockerCompiler from '../src/DockerCompiler'
import NixGenerator from '../src/NixGenerator'
import MockUrlFetcher from './MockUrlFetcher'
import { fixture } from './test-functions'

const urlFetcher = new MockUrlFetcher()

jest.setTimeout(30 * 60 * 1000)

/**
 * When applied to an environment with packages from several languages, generate should return
 * Dockerfile with R and the packages installed
 */
test('generate:packages', async () => {
  let expectedNixfile = fs.readFileSync(path.join(fixture('multi-lang-for-nix'), 'default.nix.expected'), 'utf8')

  const compiler = new DockerCompiler(urlFetcher)
  let environ = await compiler.compile('file://' + fixture('multi-lang-for-nix'), false, false)

  const generator = new NixGenerator(urlFetcher, undefined)
  let nixfile = generator.generate(environ, fixture('multi-lang-for-nix')).split('\n').slice(1).join('\n')

  expect(nixfile).toEqual(expectedNixfile)
})
