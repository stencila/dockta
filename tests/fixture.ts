import path from 'path'

export default function fixture (folder: string): string {
  return path.join(__dirname, 'fixtures', folder)
}
