import os from 'os'
import path from 'path'
import stream from 'stream'

import Docker from 'dockerode'

/**
 * Executes a Docker environment.
 *
 * This class has a single method, `execute`, which starts a container from an
 * image and runs the command specified in the Dockerfile `CMD` instruction.
 *
 * It mounts the project's directory into the container a `/work` and uses it
 * as the working directory.
 *
 * It also sets the current user and group as the
 * user and group in the container. This means that within the container the
 * command that runs has the same permissions as the current user does in the
 * `/work` directory.
 *
 * Finally, it removes the container (but not the image).
 *
 * This then is the equivalent of running the container with Docker from within
 * the project directory using,
 *
 *     docker run --rm --volume $(pwd):/work --workdir=/work --user=$(id -u):$(id -g) <image>
 */
export default class DockerExecutor {

  /**
   * Run a Docker container
   *
   * @param name Name of the Docker image to use
   * @param folder Path of the project folder which will be mounted into the image
   */
  async execute (name: string, folder: string, command: string = '') {
    // Capture stdout so we can attempt to parse it
    // to JSON
    let out = ''
    let stdout = new stream.Writable({
      write (chunk, encoding, callback) {
        out += chunk.toString()
        callback()
      }
    })

    // Just write errors through to local console error
    let stderr = new stream.Writable({
      write (chunk, encoding, callback) {
        console.error(chunk.toString())
        callback()
      }
    })

    // Get and set user:group
    const userInfo = os.userInfo()
    const user = `${userInfo.uid}:${userInfo.gid}`

    // Run the container!
    // Options from https://docs.docker.com/engine/api/v1.37/#operation/ContainerCreate
    const docker = new Docker()
    // If the user has specified a command thaen use  that, otherwise fallback to the
    // CMD in the Dockerfile
    let cmd
    if (command) cmd = command.split(' ')
    const container = await docker.run(name, [], [stdout, stderr], {
      Cmd: cmd,
      HostConfig: {
        Binds: [
          `${path.resolve(folder)}:/work`
        ]
      },
      Tty: false,
      User: user,
      WorkingDir: '/work'
    })
    container.remove()

    // Attempt to parse output as JSON
    try {
      return JSON.parse(out)
    } catch {
      return out.trim()
    }
  }
}
