import Docker from 'dockerode'
import fs from 'fs'
import path from 'path'
import stream, { Stream } from 'stream'
import tarStream from 'tar-stream'
import tmp from 'tmp'
import { rejects } from 'assert'

export default class Builder {

  /**
   * Filesystem path to the source files for the image
   */
  private path: string

  /**
   * Is this builder active?
   *
   * A builder is only active it determines that it
   * applies to the images source files e.g. by filename matching
   */
  readonly active: boolean = false

  /**
   * The image id
   *
   * The actual SHA256 id of the image. This will change when it is
   * injected or executed into.
   */
  readonly image: string = 'some-unique-name'

  constructor (path: string) {
    this.path = path

    for (let path of this.matchPaths()) {
      if (this.exists(path)) {
        this.active = true
        break
      }
    }
  }

  exists (subpath: string): boolean {
    return fs.existsSync(path.join(this.path, subpath))
  }

  read (subpath: string): string {
    return fs.readFileSync(path.join(this.path, subpath), 'utf8')
  }

  /**
   * Build a Dockerfile
   */
  dockerfile (): string {
    let dockerfile = ''

    const sysVersion = this.sysVersion()

    dockerfile += `
FROM ubuntu:${sysVersion}
`

    const aptRepos = this.aptRepos(sysVersion)
    if (aptRepos.length) {
      // Install system packages required for adding repos
      dockerfile += `
RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      software-properties-common
`

      // Add each repository and fetch signing key if defined
      for (let [deb, key] of aptRepos) {
        dockerfile += `
RUN apt-add-repository "${deb}"${key ? ` \\\n && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys ${key}` : ''}
`
      }
    }

    let aptPackages = this.aptPackages(sysVersion)
    if (aptPackages.length) {
      dockerfile += `
RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      ${aptPackages.join(' \\\n      ')} \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*
`
    }

    // Copy any files over
    // Use COPY instead of ADD since the latter can add a file from a URL so is
    // not reproducible
    const copyFiles = this.copyFiles(sysVersion)
    if (copyFiles) {
      dockerfile += `
COPY ${copyFiles.join('')} .
`
    }

    // Add any CMD
    const command = this.command(sysVersion)
    if (command) {
      dockerfile += `
CMD ${command}
`
    }

    return dockerfile
  }

  async build (dockerfile: string) {
    // Build the Docker image
    const docker = new Docker()

    // Put the Dockerfile into a temporary folder
    const tempDir = tmp.dirSync().name
    fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfile)
    const copyFiles = this.copyFiles(this.sysVersion())
    for (let file of copyFiles) {
      const from = path.join(this.path, file)
      const to = path.join(tempDir, file)
      fs.writeFileSync(to, fs.readFileSync(from))
    }

    const messages: Array<Object> = []
    const stream = await docker.buildImage({
      context: tempDir,
      src: ['Dockerfile', ...copyFiles]
    }, {
      // Options to Docker ImageBuild operation
      // See https://docs.docker.com/engine/api/v1.37/#operation/ImageBuild
      t: this.image
    }).catch(error => {
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

    if (!stream) return

    await new Promise((resolve, reject) => {
      stream.on('data', data => {
        data = JSON.parse(data)
        if (data.error) {
          messages.push({
            level: 'error',
            message: data.error
          })
          console.error(data.error)
        } else if (data.aux && data.aux.ID) {
          // node.handle = data.aux.ID
          // TODO Unique identifier for Docker images based
          // on repository and sha256
          // node.id = `https://hub.docker.com/#${data.aux.ID}`
        } else {
          // We could keep track of data that looks like this
          //  {"stream":"Step 2/2 : RUN foo"}
          // to match any errors with lines in the Dockefile content
          console.error(data.stream)
        }
      })
      stream.on('end', () => resolve())
      stream.on('error', reject)
    })

    const { files, command } = this.installPackages(this.sysVersion())
    await this.inject(files, command)
  }

  async inject (content: {[key: string]: string}, command: Array<string> = [], env: Array<string> = []) {
    const docker = new Docker()

    // Create a container from the image
    let container = await docker.createContainer({
      Image: this.image,
      Tty: true,
      Cmd: ['/bin/bash']
    })

    // Put injected files into a tar archive
    const pack = tarStream.pack()
    for (let [key, value] of Object.entries(content)) {
      pack.entry({ name: key }, value)
    }
    pack.finalize()
    await container.putArchive(pack, { path: '.' })

    if (command.length === 0) return

    await container.start()

    // Create an execution in the container
    const exec = await container.exec({
      Cmd: command,
      Env: env,
      AttachStdout: true,
      AttachStderr: true
    })
    await exec.start()

    // TODO: do something with stdout and stderr?
    container.modem.demuxStream(exec.output, process.stdout, process.stderr)

    // Wait until the exec has finished running, checking every
    // 100ms
    // TODO: abort after an amount of time
    while (true) {
      let status = await exec.inspect()
      if (status.Running === false) break
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Create an image from the container
    const data = await container.commit({
      // Options to commit
      // See https://docs.docker.com/engine/api/v1.37/#operation/ImageCommit
      // Use tag for this builder
      repo: this.image,
      comment: 'Updated image'
    })

    await container.stop()
  }

  matchPaths (): Array<string> {
    return []
  }

  sysVersion (): number {
    return 18.04
  }

  sysVersionName (sysVersion: number): string {
    const lookup: {[key: string]: string} = {
      '14.04': 'trusty',
      '16.04': 'xenial',
      '18.04': 'bionic'
    }
    return lookup[sysVersion]
  }

  aptRepos (sysVersion: number): Array<[string, string]> {
    return []
  }

  aptPackages (sysVersion: number): Array<string> {
    return []
  }

  installPackages (sysVersion: number): { files: {}, command: Array<string>} {
    return { files: {}, command: [] }
  }

  copyFiles (sysVersion: number): Array<string> {
    return []
  }

  command (sysVersion: number): string | undefined {
    return
  }
}
