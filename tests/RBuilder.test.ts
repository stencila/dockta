import RBuilder from '../src/RBuilder'
import fixture from './fixture'

test('empty', () => {
  const builder = new RBuilder(fixture('empty'))
  expect(builder.active).toEqual(false)
})

test('r-date', async () => {
  const builder = new RBuilder(fixture('r-date'))
  expect(builder.active).toEqual(true)

  const dockerfile = builder.dockerfile()
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

COPY cmd.R .

CMD Rscript cmd.R
`)

 await builder.build(dockerfile)
})
