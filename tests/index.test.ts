import Compiler from '../src'

test('load', () => {
  const compiler = new Compiler()
  
  let node = compiler.load(`FROM ubuntu`)
  expect(node.programmingLanguage).toEqual('Dockerfile')
})
