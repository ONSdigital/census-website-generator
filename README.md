# Census Website Generator
Static site generator for the Census website.

The Census Website Generator has been created to work with the [Census Website CMS](https://github.com/ONSdigital/census-website-cms).

It's function is to get json data from API endpoints and build static html files.

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
yarn
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


## Template globals

The following globals are provided to templates by the generator:

---
  - `designSystemVersion` (string) - Semantic version of the design package.
---
  - `site` - **string** - Name of the current site; eg. "ni".
  - `siteBaseUrl` - **string** - Base URL of the current site; eg. "http://localhost:4040/ni/".
  - `siteBasePath` - **string** - Base path within the current site; eg. "/ni/".
  - `craftBaseUrl` - **string** - Base URL of the CraftCMS instance; eg. "http://localhost/".
---
  - `global` - **object** - globalElements from CraftCMS.
  - `globalNews` - **object** - globalNews from CraftCMS.
  - `entries` - **array** - Array of all entries from CraftCMS or procedurally generated.
  - `categories` - **array** - Array of all categories from CraftCMS.
  - `assets` - **array** - Array of all assets from CraftCMS.
---
  - `newCategories` - **array** - Array of all "news" categories from CraftCMS.
  - `newTags` - **array** - Array of all "news" tag categories from CraftCMS.
---
  - `entry` - **object** - The current entry either from CraftCMS or procedurally generated.
---
  - `getEntryById(id: number): object|null` - **function** - Gets an entry or null with the given ID.
  - `getCategoryById(id: number): object|null` - **function** - Gets a category or null with the given ID.
  - `getAssetById(id: number): object|null` - **function** - Gets an asset or null with the given ID.
---
