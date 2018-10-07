import { Router, Request, Response, json } from 'express'
const router = Router()

import DockerCompiler from './DockerCompiler'
const compiler = new DockerCompiler()

router.use(json())

function run (method: string) {
  return async (req: Request, res: Response) => {
    try {
      // @ts-ignore
      const node = await compiler[method](req.body)
      res.status(200).json(node)
    } catch(error) {
      res.status(500).write(error.stack)
    }
  }
}

router.put('/compile', run('compile'))
router.put('/compile', run('execute'))

export default router
