import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import Docker from 'dockerode'
import yaml from 'js-yaml'
import NixGenerator from './NixGenerator'
import { SoftwareEnvironment } from '@stencila/schema'
import CachingUrlFetcher from './CachingUrlFetcher'

const generator = new NixGenerator(new CachingUrlFetcher(), undefined)
const docker = new Docker()

/**
 * Generates a default.nix and a nixDockerfile for a `SoftwareEnvironment`
 */
function compile (environ: void | SoftwareEnvironment | null, folder: any) {
  // Generate .default.nix file
  generator.generate(environ, folder)

  // Figure out if a custom default.nix file is present
  let defaultNix = path.join(folder, 'default.nix')
  let dockterNix = path.join(folder, '.default.nix')
  let nixfile = fs.existsSync(defaultNix) ? defaultNix : dockterNix

  // Generate .nixDockerfile
  let dockerfile = path.join(folder, '.nixDockerfile')

  fs.writeFileSync(dockerfile, `FROM nixos/nix

# Copy over the Nix derivation
COPY ${path.basename(nixfile)} default.nix
# Run nix-shell
CMD nix-shell --pure\n`
  )
}

/**
 * Builds a Docker image from a nixDockerfile
 */
async function build (folder: any) {
  let name = path.basename(folder).toLocaleLowerCase().replace(' ', '-')

  // Figure out if a custom default.nix file is present
  let defaultNix = path.join(folder, 'default.nix')
  let dockterNix = path.join(folder, '.default.nix')
  let nixfile = fs.existsSync(defaultNix) ? defaultNix : dockterNix

  // Start building the image
  let build = await docker.buildImage({
    context: folder,
    src: ['.nixDockerfile', path.basename(nixfile)]
  }, { t: name, dockerfile: '.nixDockerfile' })

  // Wait for image to finish building
  docker.modem.followProgress(build, (err: any, res: any) => {
    if (err) throw err
    output(res)
  })
}

/**
 * Executes nix-shell inside a Docker image from nixDockerfile with a Docker data volume for /nix store
 */
async function execute (folder: any) {
  // Create shared /nix/store Docker volume if needed
  let volumes: any = await docker.listVolumes()
  let nixStoreVolume = volumes.Volumes.find((vol: any) => (vol.Name === 'nix-store'))
  if (!nixStoreVolume) { await docker.createVolume({ name: 'nix-store' }) }

  let name = path.basename(folder).toLocaleLowerCase().replace(' ', '-')
  spawnSync(
    'docker', `run -it --rm -v /tmp:/tmp -v nix-store:/nix ${name} /root/.nix-profile/bin/nix-shell`.split(' '),
    {
      shell: true,
      cwd: process.cwd(),
      stdio: 'inherit'
    }
  )
}

export default { compile, build, execute }

/**
 * Print output to stdout
 *
 * @param object The object to print
 * @param format The format use: `json` or `yaml`
 */
function output (object: any, format: string = 'json') {
  if (object) console.log(format === 'yaml' ? yaml.safeDump(object, { lineWidth: 120 }) : JSON.stringify(object, null, '  '))
}
