# Contributing

🎉 Thanks for taking the time to contribute to Dockter! 🎉


# Table of Contents

[General contribution guidelines](#general-contribution-guidelines)
 * [Licensing and contributor agreement](#licensing-and-contributor-agreement)

[Development](#development)
 * [Development environment](#development-environment)
 * [Linting and testing](#linting-and-testing)
 * [Documentation generation](#documentation-generation)
 * [Commit messages](#commit-messages)
 * [Continuous integration](#continuous-integration)
 * [Python System Dependencies](#python-system-dependencies)
 * [Using The Router and Server](#using-the-router-and-server)

# General contribution guidelines

[Stencila][stencila-site] is an open-source community-driven project. We encourage
and welcome contributions from all community members.

These are mostly guidelines, not rules. 
Use your best judgment, and feel free to propose changes to this document in a pull request.

If you are comfortable with Git and GitHub, you can submit a pull request (PR). In Stencila we follow a commonly used workflow
for [contributing to open source projects][how-contribute] (see also [GitHub instructions][github-flow]).

If you have specific suggestions or have found a bug, please [create an issue](https://github.com/stencila/dockter/issues/new).

If you don't want to use GitHub, please tell us what you think on [our chat](https://gitter.im/stencila/stencila) on Gitter or have your say on our
our [Community Forum](https://community.stenci.la/).

## Licensing and code of conduct

By contributing, you agree that we may redistribute your work under [our license](LICENSE).
Everyone involved with Stencila agrees to abide by our [code of conduct][conduct].

## Get in touch!

You can chat with the team at our [community forum][community-forum],
on Twitter [@Stencila][stencila-twitter],
[Gitter][stencila-gitter], or email to [hello@stenci.la][contact]


## Development

### Getting started

### Development environment

Dockter is implemented as a `Node.js` package in order to make it easier to integrate with other Stencila components written also in this language.
Therefore, in order to develop Dockter you need to have `Node.js` installed on your machine, along with `npm`. 
The core of the source code of Dockter is written using [`TypeScript`](https://www.typescriptlang.org/) which is then compiled into JavaScript.   

To get started,

```bash
git clone https://github.com/stencila/dockter
cd dockter
npm install
```

To run the CLI during development use, `npm run cli -- <args>` e.g.

```bash
npm run cli -- compile tests/fixtures/dockerfile-date/Dockerfile
```

This uses `ts-node` to compile and run Typescript on the fly so that you don't need to do a build step first.


## Architecture

Dockter implements a compiler design pattern. Source files are _parsed_ into a `SoftwareEnvironment` instance (the equivalent of an AST (Abstract Syntax Tree) in other programming language compilers) which is then used to generate a `Dockerfile` which is then built into a Docker image.

The parser classes e.g. `PythonParser`, `RParser` scan for relevant source files and generate `SoftwareEnvironment` instances.
The generator classes e.g. `PythonGenerator`, `RGenerator` generates a `Dockerfile` for a given `SoftwareEnvironment`.
`DockerGenerator` is a super-generator which combines the other generators.
`DockerBuilder` class builds 
`DockerCompiler` links all of these together.

For example, if a folder has single file in it `code.py`, `PythonParser` will parse that file and create a `SoftwareEnvironment` instance, which `DockerGenerator` uses to generate a `Dockerfile`, which `DockerBuilder` uses to build a Docker image.


### Linting and testing

Please check that your changes pass linting and unit tests,

```bash
npm run lint # or, make lint
npm test # or, make text
```

Use `npm test -- <test file path>` to run a single test file.

You can setup a Git pre-commit hook to perform these checks automatically before each commit using `make hooks`.

You can check that any changes you've made are covered 🏅 by unit tests using,

```bash
npm run cover # or, make cover
open coverage/lcov-report/index.html
```

### Documentation generation

If you've been working on in-code documentation 🙏 you can check that by building and viewing the docs,

```bash
npm run docs # or, make docs
open docs/index.html
```

### Commit messages

Please use [conventional changelog](https://github.com/conventional-changelog/conventional-changelog) style commit messages e.g. `docs(readme): fixed spelling mistake`. See [the specifications](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) for full details. This help with automated semantic versioning. 
To make this easier, [Commitzen](http://commitizen.github.io/cz-cli/) is a development dependency and can be used via `npm` or `make`:

```bash
npm run commit # or, make commit
```

### Continuous integration

Linting, test coverage, binary builds, package builds, and documentation generation are done on [Travis CI](https://travis-ci.org/stencila/dockter). [`semantic-release`](https://github.com/semantic-release/semantic-release) is enabled to automate version management: minor version releases are done if any `feat(...)` commits are pushed, patch version releases are done if any `fix(...)` commits are pushed. Releases are made to [NPM](https://www.npmjs.com/package/@stencila/dockter) and [Github Releases](https://github.com/stencila/dockter/releases).


### Python System Dependencies

We maintain a list of system packages (e.g `deb`/`rpm`) that a Python packages installed through `pip` might need to include. These are in the file `PythonSystemDependencies.json`.
If you find a Python package that relies on a system library you can add the lookup to this file; the mapping is in the format `lookup[pythonPackageName][pythonVersion(str)][packagingType][osVersion]`. The `"default"` can be used as a fallback at any level. For example:

- `["pypackage"]["2"]["deb"]["trusty"] = ["some-deb-package"]`
- `["otherpypackage"]["3"]["rpm"]["default"] = ["some-rpm-package"]`
- `["thirdpypackage"]["default"]["default"]["default"] = ["some-consistent-package", "some-other-package"]`


### Using the router and server

The [Express](https://expressjs.com) router provides `PUT /compile` and `PUT /execute` endpoints (which do the same thing as the corresponding CLI commands). You can serve them using,

```bash
npm start
```

Or, during development using,

```bash
npm run server
```

A minimal example of how to integrate the router into your own Express server,

```js
const app = require('express')()
const { docker } = require('@stencila/dockter')

const app = express()
app.use('/docker', docker)
app.listen(3000)
```



[contact]: mailto:hello@stenci.la
[conduct]: https://github.com/stencila/policies/blob/master/CONDUCT.md
[github-flow]: https://guides.github.com/introduction/flow/
[github-join]: https://github.com/join
[issues]: https://help.github.com/articles/creating-an-issue/
[how-contribute]: https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github
[stencila-site]: http://stenci.la/
[stencila-repo]: https://github.com/stencila/stencila
[stencila-twitter]: https://twitter.com/stencila
[stencila-gitter]: https://gitter.im/stencila/stencila/