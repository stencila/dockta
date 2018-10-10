import RWriter from '../src/RWriter'
import fixture from './fixture'

test('empty', () => {
  const writer = new RWriter(fixture('empty'))
  expect(writer.active).toEqual(false)
})

test('r-date', async () => {
  const writer = new RWriter(fixture('r-date'))
  expect(writer.active).toEqual(true)

  const dockerfile = writer.dockerfile()
  expect(dockerfile).toEqual(`
FROM ubuntu:16.04

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      apt-transport-https \\
      ca-certificates \\
      software-properties-common

RUN apt-add-repository \"deb https://mran.microsoft.com/snapshot/2018-10-05/bin/linux/ubuntu xenial/\" \\
 && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 51716619E084DAB9

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \\
      r-base \\
 && apt-get autoremove -y \\
 && apt-get clean \\
 && rm -rf /var/lib/apt/lists/*

# dockter

COPY . .

RUN Rscript install.R

CMD Rscript cmd.R
`)
})
