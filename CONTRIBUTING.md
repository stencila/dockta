# General contribution guidelines

[Stencila][stencila-site] is an open-source community-driven project. We encourage
and welcome contributions from all community members.

If you are comfortable with Git and GitHub, you can submit a pull request (PR). In Stencila we follow a commonly used workflow
for [contributing to open source projects][how-contribute] (see also [GitHub instructions][github-flow]).

If you have specific suggestions or have found a bug, please [create an issue](https://github.com/stencila/dockter/issues/new).

If you don't want to use GitHub, please tell us what you think on [our chat](https://gitter.im/stencila/stencila) on Gitter or have your say on our
our [Community Forum](https://community.stenci.la/).

## Licensing and contributor agreement

By contributing, you agree that we may redistribute your work under [our license](LICENSE).
Everyone involved with Stencila agrees to abide by our [code of conduct][conduct].

# Development

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

### Linting and testing

Then take a look at the docs ([online](https://stencila.github.io/dockter/) or inline) and start hacking! Please check that your changes pass linting and unit tests,

```bash
npm run lint # or, make lint
npm test # or, make text
```

Use `npm test -- <test file path>` to run a single test file

You can setup a Git pre-commit hook to perform these checks automatically before each commit using `make hooks`.

Check that any changes you've made are covered 🏅 by unit tests using,

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

Please use [conventional changelog](https://github.com/conventional-changelog/conventional-changelog) style commit messages e.g. `docs(readme): fixed spelling mistake`. This help with automated semantic versioning. To make this easier, [Commitzen](http://commitizen.github.io/cz-cli/) is a development dependency and can be used via `npm` or `make`:

```bash
npm run commit # or, make commit
```

### Continuous integration

Linting, test coverage, binary builds, package builds, and documentation generation are done on each push on [Travis CI](https://travis-ci.org/stencila/dockter). [`semantic-release`](https://github.com/semantic-release/semantic-release) is enabled to automate version management, Github releases and NPM package publishing.


## See also

Related Stencila packages include:

- 🦄 [`stencila/tunix`](https://github.com/stencila/tunix): compiles JSON-LD `SoftwareEnvironment` nodes to [NixOS](https://nixos.org/) environments
- 🦄 [`stencila/kubex`](https://github.com/stencila/kubex): executes JSON-LD `SoftwareEnvironment` nodes on [Kubernetes](https://kubernetes.io/) clusters

There are several projects that create Docker images from source code and/or requirements files:

- [`alibaba/derrick`](https://github.com/alibaba/derrick)
- [`jupyter/repo2docker`](https://github.com/jupyter/repo2docker)
- [`Gueils/whales`](https://github.com/Gueils/whales)
- [`o2r-project/containerit`](https://github.com/o2r-project/containerit)
- [`openshift/source-to-image`](https://github.com/openshift/source-to-image)
- [`ViDA-NYU/reprozip`](https://github.com/ViDA-NYU/reprozip])

Dockter is similar to `repo2docker`, `containerit`, and `reprozip` in that it is aimed at researchers doing data analysis (and supports R) whereas most other tools are aimed at software developers (and don't support R). Dockter differs to these projects principally in that by default (but optionally) it installs the necessary Stencila language packages so that the image can talk to Stencila client interfaces an provide code execution services. Like `repo2docker` it allows for multi-language images but has the additional features of package dependency analysis of source code, managed builds and generated of image meta-data.


## Get in touch!

You can chat with the team at our [community forum][community-forum],
on Twitter [@Stencila][stencila-twitter],
[Gitter][stencila-gitter], or email to [hello@stenci.la][contact]

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