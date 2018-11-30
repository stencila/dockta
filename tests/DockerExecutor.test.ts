import Docker from 'dockerode'
import DockerExecutor from '../src/DockerExecutor'
import { fixture } from './test-functions'

const docker = new Docker
const executor = new DockerExecutor

jest.setTimeout(30 * 60 * 1000)

/**
 * Tests of executing container
 */

test('execute:stdout', async () => {
 
  await docker.buildImage({
    context: fixture('dockerfile-execute-stdout'),
    src: ['Dockerfile']
  }, {t: 'dockerfile-execute-stdout'})


  let output = await executor.execute('dockerfile-execute-stdout', __dirname)
  expect(output).toEqual('hello')

})

test('execute:stderr', async () => {
 
  await docker.buildImage({
    context: fixture('dockerfile-execute-stderr'),
    src: ['Dockerfile']
  }, {t: 'dockerfile-execute-stderr'})

  let outputError = ''

  const spy = jest.spyOn(console,'error')
  .mockImplementation((data:string) => {
    outputError += data
  })

  await executor.execute('dockerfile-execute-stderr', __dirname)
  
  expect(outputError.trim()).toBe('epicfail')

  spy.mockRestore()
})
