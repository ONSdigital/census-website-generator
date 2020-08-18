# Census Website Generator
Static site generator for the Census website.

The Census Website Generator has been created to work with the [Census Website CMS](https://github.com/ONSdigital/census-website-cms).

It's function is to get json data and other assets from the filesystem, as specified in the environment variable ONS_STATIC_SITE_SOURCE and build static html files.

It uses the [ONS Design System](https://github.com/ONSdigital/design-system) components and macros which are made available as an NPM package.

## Run Locally

You'll need [Git](https://help.github.com/articles/set-up-git/), [Node.js](https://nodejs.org/en/), and [Yarn](https://yarnpkg.com/en/docs/getting-started) to run this project locally.

The version of node required is outlined in [.nvmrc](./.nvmrc).

### Using nvm (optional)

If you work across multiple Node.js projects there's a good chance they require different Node.js and npm versions.

To enable this we use [nvm (Node Version Manager)](https://github.com/creationix/nvm) to switch between versions easily.

1. [install nvm](https://github.com/creationix/nvm#installation)
2. Run nvm install in the project directory (this will use .nvmrc)

### Install dependencies

```bash
yarn install
```

### Start a local server

```bash
yarn preview-site
```

Once the server has started, navigate to <http://en.localhost:4040>


### Upgrading to the latest design system release

```bash
yarn upgrade @ons/design-system
```

Then update the version in `package.json` and the `_master.html` template.
