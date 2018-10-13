/**
 * TypeScript respresentations of Stencila JSON-LD @context types
 *
 * This is a temporay context. We are likely to generate these files
 * from JSON Schema definitions in the near future.
 */

// Data types
type Text = string

class Thing {
  readonly type: string = 'Thing'
  id: string = ''

  description: Array<Text> = []
}

// https://schema.org/author
type author = Person // should be Organization|Person|Array<Organization|Person>

// Would be good to have a `authorParse` function to take
// a string like "Nokome Bentley <nokome@stenci.la> (https://stenci.la)" and parse
// out givenName familyName email etc

export class Person extends Thing {
  readonly type: string = 'Person'

  name: Array<Text> = []
  givenName: Array<Text> = []
  familyName: Array<Text> = []
  email: Array<Text> = []
  url: Array<Text> = []
}

function compilePerson (source: string | Person, format: string = 'text'): Person {
  if (source instanceof Person) return source

  let name
  let givenName
  let familyName
  let email
  let url
  const match = source.match(/^([^\s]*)\s+([^\s]+)?\s*(<([^>]*)>)?\s*(\(([^)]*)\))?/)
  if (match) {
    givenName = match[1]
    familyName = match[2]
    name = givenName + ' ' + familyName
    email = match[4]
    url = match[6]
  } else {
    name = source
  }
  return create(Person, { name, givenName, familyName, email, url })
}

/**
 * Create a new JSON-LD node of a particular type
 *
 * @param type The type of node to create
 * @param properties
 */
function create<Type> (type: { new(): Type; }, properties: Object = {}): Type {
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

export function pushAuthor (node: CreativeWork, property: string | Person) {
  node.author.push(compilePerson(property))
}

export class CreativeWork extends Thing {
  readonly type: string = 'CreativeWork'

  author: Array<Person> = []
  text: string = ''
}

// https://schema.org/SoftwareSourceCode
export class SoftwareSourceCode extends CreativeWork {
  readonly type: string = 'SoftwareSourceCode'

  programmingLanguage: string = ''
  id: string = ''
  messages: Array<SoftwareSourceCodeMessage> = []

  handle: string = '' // The sha used to identify the image
  output: string = '' // Output of executing the container
}

export class SoftwareSourceCodeMessage extends Thing {
  readonly type: string = 'SoftwareSourceCodeMessage'

  level?: string
  line?: number
  column?: number
  message?: string
}

export class SoftwareEnvironment {

}
