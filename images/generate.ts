/**
 * Script for generating a list of packages from a
 * JSON spec file and package download stats.
 *
 * See `./generate.sh` for example usages.
 * See `/packages/*` for specs and download stats.
 */

import fs from 'fs'
import path from 'path'

const specFile = process.argv[2]

const spec: {
  dest: string
  stats: string
  number: number
  exclude: string[]
  include: string[]
} = JSON.parse(fs.readFileSync(specFile, 'utf-8'))

const statsFile = path.join(path.dirname(specFile), spec.stats)
const destFile = path.join(path.dirname(specFile), spec.dest)

const packages = fs
  .readFileSync(statsFile, 'utf-8')
  .split('\n')
  .slice(1)
  .reduce((prev: string[], line: string) => {
    const parts = line.split('\t')
    const name = parts[0]
    return name.length > 0 && !spec.exclude.includes(name)
      ? [...prev, name]
      : prev
  }, [])
  .slice(0, spec.number - spec.include.length)
  .concat(spec.include)
  .reduce(
    (prev: string[], curr: string) =>
      prev.includes(curr) ? prev : [...prev, curr],
    []
  )
  .sort((a, b) => a.localeCompare(b))

if (destFile.endsWith('/DESCRIPTION')) {
  fs.writeFileSync(
    destFile,
    fs
      .readFileSync(destFile, 'utf-8')
      .replace(
        /Imports:(.|\n)*/m,
        'Imports:\n  ' + packages.join(',\n  ') + '\n'
      )
  )
} else if (destFile.endsWith('/requirements.txt')) {
  fs.writeFileSync(
    destFile,
    fs
      .readFileSync(destFile, 'utf-8')
      .replace(/\n\n(.|\n)*/m, '\n\n' + packages.join('\n') + '\n')
  )
}
