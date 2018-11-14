import fs from 'fs'

type PythonSystemPackageLookupMap = Map<string, Map<string, Map<string, Map<string, Array<string> | null>>>>

/**
 * Parses a value and converts it to a Map (recursively) if it is a plain JavaScript object, otherwise just return the
 * value
 */
function valueToMap (value: any): any {
  if (!Array.isArray(value) && typeof value === 'object') {
    let m = new Map<any, any>()
    for (let key in value) {
      if (!value.hasOwnProperty(key)) {
        continue
      }

      m.set(key, valueToMap(value[key]))
    }
    return m
  }
  return value
}

/**
 * An object that looks up if any system packages are required for a Python package.
 * The lookup is in the format {packageName: pythonVersion: systemPackageType: systemVersion: [sysPackage, sysPackage...]}
 */
export default class PythonSystemPackageLookup {
  /**
   * @param packageLookup: PythonSystemPackageLookupMap the Map
   */
  constructor (private readonly packageLookup: PythonSystemPackageLookupMap) {
  }

  /**
   * Construct a `PythonSystemPackageLookup` by parsing a JSON representation of the package map from `path`
   */
  static fromFile (path: string): PythonSystemPackageLookup {
    const dependencyLookupRaw = JSON.parse(fs.readFileSync(path, 'utf8'))
    return new PythonSystemPackageLookup(valueToMap(dependencyLookupRaw))
  }

  /**
   * Look up the system package required for a python package given python version, package type and system version.
   * Will always return an Array, which will be empty if there are no packages to install.
   */
  lookupSystemPackage (pythonPackage: string, pythonMajorVersion: number, systemPackageType: string, systemVersion: string): Array<string> {
    const pyPackageMap = this.packageLookup.get(pythonPackage)

    if (!pyPackageMap) {
      return []
    }

    const pyVersionStr = `${pythonMajorVersion}`

    let pyVersionMap

    if (pyPackageMap.has(pyVersionStr)) {
      pyVersionMap = pyPackageMap.get(pyVersionStr)
    } else {
      pyVersionMap = pyPackageMap.get('default')
    }

    if (!pyVersionMap) {
      return []
    }

    let systemVersionMap

    if (pyVersionMap.has(systemPackageType)) {
      systemVersionMap = pyVersionMap.get(systemPackageType)
    } else {
      systemVersionMap = pyVersionMap.get('default')
    }

    if (!systemVersionMap) {
      return []
    }

    let systemPackages

    if (systemVersionMap.has(systemVersion)) {
      systemPackages = systemVersionMap.get(systemVersion)
    } else {
      systemPackages = systemVersionMap.get('default')
    }

    return systemPackages || []
  }
}
