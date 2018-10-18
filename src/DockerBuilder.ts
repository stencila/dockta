import crypto from 'crypto'
import Docker from 'dockerode'
import fs from 'fs'
import parser from 'docker-file-parser'
import path from 'path'
import tarFs from 'tar-fs'

/**
 * Builds Docker images from Dockerfiles
 *
 * The Dockerfile may be handwritten, or generated
 * from requirements files or source code.
 */
export default class DockerBuilder {

  private docker: Docker

  constructor () {
    this.docker = new Docker()
  }

  async build (dir: string, name?: string, dockerfile: string = 'Dockerfile') {
    if (!name) {
      const hash = crypto.createHash('md5').update(dir).digest('hex')
      name = 'dockter-' + hash
    }

    const content = fs.readFileSync(path.join(dir, dockerfile), 'utf8')
    let instructions = parser.parse(content, { includeComments: true })

    // Collect all instructions prior to any `# dockter` comment into a
    // new Dockerfile and store remaining instructions for special handling
    let dockterize = false
    let newContent = ''
    let index = 0
    for (let instruction of instructions) {
      if (instruction.name === 'COMMENT') {
        const arg = instruction.args as string
        if (arg.match(/^# *dockter/)) {
          instructions = instructions.slice(index + 1)
          dockterize = true
          break
        }
      }
      if (instruction.raw) newContent += instruction.raw + '\n'
      index += 1
    }
    // If there was no # dockter comment then make sure there are no
    // 'extra' instructions
    if (!dockterize) instructions = []

    // Pack the directory and replace the Dockerfile with the new one
    const pack = tarFs.pack(dir, {
      ignore: name => {
        // Ignore original Dockerfile
        // TODO: implement `.dockerignore` behavior
        return path.relative(name, dir) === 'Dockerfile'
      },
      finalize: false,
      finish: pack => {
        // Add new Dockerfile
        pack.entry({ name: 'Dockerfile' }, newContent)
        pack.finalize()
      }
    })
    // The following line can be useful in debugging the
    // above tar stream generation
    // pack.pipe(tarFs.extract('/tmp/dockter-builder-debug-1'))

    const messages: Array<Object> = []
    const stream = await this.docker.buildImage(pack, {
      // Options to Docker ImageBuild operation
      // See https://docs.docker.com/engine/api/v1.37/#operation/ImageBuild
      t: name + ':system'
    })

    // The following catches errors from abovr and turns them into messages but does
    // nothing with them. It's commented out for now, so errors get thrown to console,
    // but will be reinstated when we determine the best place to attach these errors/messages
    /*
    .catch(error => {
      let line
      let message = error.message
      const match = message.match(/^\(HTTP code 400\) unexpected - Dockerfile parse error line (\d+): (.*)$/)
      if (match) {
        line = parseInt(match[1], 0)
        message = match[2]
      }
      messages.push({
        level: 'error',
        line: line,
        message: message
      })
    })

    // If there were any errors then return
    //if (!stream) return
    */

    // Wait for build to finish and record the id of the system layer
    let currentSystemLayer = await new Promise<string>((resolve, reject) => {
      let id: string
      stream.on('data', data => {
        data = JSON.parse(data)
        if (data.error) {
          messages.push({
            level: 'error',
            message: data.error
          })
          console.error(data.error)
        } else if (data.aux && data.aux.ID) {
          id = data.aux.ID
        } else {
          // We could keep track of data that looks like this
          //  {"stream":"Step 2/2 : RUN foo"}
          // to match any errors with lines in the Dockerfile content
          if (data.stream) {
            process.stderr.write(data.stream)
          }
        }
      })
      stream.on('end', () => resolve(id))
      stream.on('error', reject)
    })

    // Get information on the current
    const image = this.docker.getImage(name + ':latest')
    let appLayer
    let lastSystemLayer
    try {
      const imageInfo = await image.inspect()
      appLayer = imageInfo.Id
      lastSystemLayer = imageInfo.Config.Labels && imageInfo.Config.Labels.systemLayer
    } catch (error) {
      // No existing image, just continue
    }

    // If the foundation image has changed then use the new version,
    // otherwise use the existing one
    let layer
    if (lastSystemLayer) {
      if (lastSystemLayer !== currentSystemLayer) layer = currentSystemLayer
      else layer = appLayer
    } else {
      layer = currentSystemLayer
    }

    // Create a container from the layer and start it up
    let container = await this.docker.createContainer({
      Image: layer,
      Tty: true,
      Cmd: ['/bin/bash']
    })
    await container.start()

    // Handle the remaining instructions
    let count = 1
    let changes = ''
    for (let instruction of instructions) {
      const step = `Dockter ${count}/${instructions.length} :`
      switch (instruction.name) {
        case 'COPY':
        case 'ADD':
          // Add files/subdirs to the container
          // TODO: only copy files if they have changed
          // TODO: to be consistent with Docker ADD should handle urls
          const copy = instruction.args as Array<string>
          console.error(step, instruction.name, copy.join(' '))
          const to = copy.pop() as string
          const pack = tarFs.pack(dir, {
            // Set the destination of each file (last item in `COPY` command)
            map: function (header) {
              header.name = to
              return header
            },
            // Ignore any files in the directory that are not in the `COPY` list
            ignore: name => {
              const relativePath = path.relative(dir, name)
              return !copy.includes(relativePath)
            }
          })
          await container.putArchive(pack, { path: '.' }) // TODO this should put to WORKDIR if specified
          break

        case 'RUN':
          // Execute code in the container
          const script = instruction.args as string
          console.error(step, 'RUN', script)
          const exec = await container.exec({
            Cmd: ['bash', '-c', `${script}`],
            AttachStdout: true,
            AttachStderr: true,
            Tty: true
          })
          await exec.start()

          // TODO: do something with stdout and stderr?
          exec.output.pipe(process.stdout)

          // Wait until the exec has finished running, checking every 100ms
          // TODO: abort after an amount of time
          while (true) {
            let status = await exec.inspect()
            if (status.Running === false) break
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          break

        case 'CMD':
          // Dockerfile instructions to apply when commiting the image
          changes += instruction.raw + '\n\n'
          break

        default:
          throw new Error(`Dockter can not yet handle a ${instruction.name} instruction. Put it before the # dockter comment in your Dockerfile.`)
      }
      count += 1
    }

    // Create an image from the modified container
    const data = await container.commit({
      // Options to commit
      // See https://docs.docker.com/engine/api/v1.37/#operation/ImageCommit
      repo: name + ':latest',
      comment: 'Updated application layer',
      changes,
      Labels: {
        systemLayer: currentSystemLayer
      }
    })

    await container.stop()
  }
}
