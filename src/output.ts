import yaml from 'js-yaml'

/**
 * Print output to stdout
 *
 * @param object The object to print
 * @param format The format use: `json` or `yaml`
 */
export function output (object: any, format: string = 'json') {
  if (!object) {
    return
  }

  console.log(
    format === 'yaml' ? yaml.safeDump(object, { lineWidth: 120 }) : JSON.stringify(object, null, '  ')
  )
}
