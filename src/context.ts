/**
 * TypeScript respresentations of Stencila JSON-LD @context types
 *
 * This is a temporay context. We are likely to generate these files
 * from JSON Schema definitions in the near future.
 */

// Data types
type Text = string
type URL = string

// A date value in ISO 8601 date format.
// https://schema.org/Date
type Date = string

class Thing {
  id?: string

  description?: Text
  identifiers?: Array<Text | URL>
  name?: Text
  urls?: Array<URL>
}

class Intangible extends Thing {

}

export class Organization extends Thing {

}

export class Person extends Thing {
  emails?: Array<Text>
  familyNames?: Array<Text>
  givenNames?: Array<Text>

  // Function to take
  // a string like "Nokome Bentley <nokome@stenci.la> (https://stenci.la)" and parse
  // out givenName familyName email etc
  static fromText (text: Text): Person {
    const person = new Person()
    const match = text.match(/^([^\s]*)\s+([^\s]+)?\s*(<([^>]*)>)?\s*(\(([^)]*)\))?/)
    if (match) {
      person.givenNames = [match[1]]
      person.familyNames = [match[2]]
      person.name = person.givenNames.join(' ') + ' ' + person.familyNames.join(' ')
      if (match[4]) person.emails = [match[4]]
      if (match[6]) person.urls = [match[6]]
    } else {
      person.name = text
    }
    return person
  }
}

export class ComputerLanguage extends Intangible {

  static r: ComputerLanguage = new ComputerLanguage()
  static py: ComputerLanguage = new ComputerLanguage()
}

export class CreativeWork extends Thing {
  authors?: Array<Organization | Person>

  // Could this method be automatically added via a decorator
  // for plural properties?
  authorsPush (author: Organization | Person) {
    push(this, 'authors', author)
  }

  contributors?: Array<Organization | Person>
  creators?: Array<Organization | Person>
  text?: Text
  datePublished?: Date
  license?: CreativeWork | URL
  version?: string
}

// https://schema.org/SoftwareSourceCode
export class SoftwareSourceCode extends CreativeWork {

  codeRepository?: URL

  // @property('codemeta:SoftwareSourceCode.maintainer')
  maintainers?: Array<Organization | Person>

  programmingLanguages?: Array<ComputerLanguage>

  runtimePlatform?: Text

  messages?: Array<SoftwareSourceCodeMessage>
}

export class SoftwareSourceCodeMessage extends Thing {
  readonly type: string = 'SoftwareSourceCodeMessage'

  level?: string
  line?: number
  column?: number
  message?: string
}

/**
 * https://schema.org/SoftwareApplication
 */
export class SoftwareApplication extends CreativeWork {
  softwareRequirements?: Array<SoftwarePackage | SoftwareApplication>

  softwareRequirementsPush (item: SoftwarePackage | SoftwareApplication) {
    push(this, 'softwareRequirements', item)
  }
}

/**
 * An extension class defined for this context to represent a software
 * package. We considered this necessary because `schema:SoftwareSourceCode`
 * has most properties needed to represent a package but not all of them.
 * Meanwhile, `schema:SoftwareApplication` has some of those missing
 * properties but lacks most of those needed. Thus, this type does
 * not introduce any new properties, but rather uses
 * schema.org properties on a subtype of `schema:SoftwareSourceCode`
 */
export class SoftwarePackage extends SoftwareSourceCode {
  /**
   * The [`schema:softwareRequirements`](https://schema.org/softwareRequirements)
   * property allows for `Text` or `URL` values. Here, we allow
   * values of software packages or applications.
   */
  softwareRequirements?: Array<SoftwarePackage | SoftwareApplication>

  softwareRequirementsPush (itme: SoftwarePackage | SoftwareApplication) {
    push(this, 'softwareRequirements', itme)
  }
}

/**
 * A software environment made up of a collection of
 * `SoftwareApplication`s.
 */
export class SoftwareEnvironment extends SoftwareApplication {
}

export function push (thing: { [key: string]: any }, property: string, item: any) {
  if (thing[property]) thing[property].push(item)
  else thing[property] = [item]
}

/**
 * Create a new JSON-LD node of a particular type
 *
 * @param type The type of node to create
 * @param properties
 */
function create<Type> (type: { new (): Type; }, properties: Object = {}): Type {
  // For an explanation of the weird parameter typing see https://stackoverflow.com/a/26696476/4625911
  const node = new type()
  pushProperties(node, properties)
  return node
}

function pushProperties<Type> (node: Type, properties: Object = {}) {
  for (let entry of Object.entries(properties)) {
    const key = entry[0]
    const value = entry[1]
    if (typeof value !== 'undefined') {
      // @ts-ignore
      node[key].push(value)
    }
  }
}
