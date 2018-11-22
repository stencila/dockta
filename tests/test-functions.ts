import path from 'path'
import fs from 'fs'

export function expectedFixture (fixtureFolder: string, fixtureName: string) {
  const fixturePath = path.join(fixtureFolder, fixtureName)
  const expectedPath = path.join(fixtureFolder, `${fixtureName}.expected`)

  expect(fs.readFileSync(fixturePath, 'utf8')).toEqual(fs.readFileSync(expectedPath, 'utf8'))
}

export function cleanup (fixturePaths: Array<string>) {
  for (let fixturePath of fixturePaths) {
    let fullPath = fixture(fixturePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }
}

export function fixture (folder: string): string {
  return path.join(__dirname, 'fixtures', folder)
}
