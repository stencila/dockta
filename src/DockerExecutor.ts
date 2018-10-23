import Docker from 'dockerode'
import path from 'path'
import stream from 'stream'

/**
 * Executes a Docker image (ie. starts a container from the image)
 *
 * Currently, this class simply runs the image and captures any
 * output. In the future it may do more advanced things like mounting data and output
 * directories into the image.
 */
export default class DockerExecutor {

  async execute (name: string) {
    const docker = new Docker()

    // Capture output stream
    let output = ''
    let outputStream = new stream.Writable()
    outputStream._write = (chunk) => {
      output += chunk
    }

    const container = await docker.run(name, [], outputStream)

    let value
    try {
      value = JSON.parse(output)
    } catch {
      value = output.trim()
    }

    return value
  }
}
