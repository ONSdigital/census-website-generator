import * as fs from 'fs';

import fetch from 'node-fetch';
import nunjucks from 'nunjucks';
import { minify } from 'html-minifier';

import { NunjucksLoader } from './nunjucks-loader';
import removeFolder from './remove-folder';
import createFolder from './create-folder';
import asyncForEach from './async-foreach';
import getAsset from './get-asset';
import rateLimiter from './rate-limiter';

const cwd = process.cwd();
const buildDestination = `${cwd}/dist`;
const viewsPath = `${cwd}/src/views`;

const languages = ['en', 'cy'];

const localPort = 4040;
const enSite = process.env.EN_SITE || 'http://en.localhost:' + localPort + '/';
const cySite = process.env.CY_SITE || 'http://cy.localhost:' + localPort + '/';

const assetFetchConcurrencyLimit = 50;

const searchPaths = [viewsPath, `${viewsPath}/templates`, `${cwd}/node_modules/@ons/design-system`];
const nunjucksLoader = new NunjucksLoader(searchPaths);
const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

const gcpURL = 'https://storage.googleapis.com/census-ci-craftcms';

let apiURL = gcpURL;
let assetURL = `${gcpURL}/assets/`;
if (process.env.NODE_ENV === 'local') {
  apiURL = 'http://localhost/api';
  assetURL = 'http://localhost/assets/uploads/';
}

let entriesJson, globalsJson, assetsJson;
async function getContent() {
  const requests = languages.map(async language => {
    try {
      const entriesResponse = await fetch(`${apiURL}/entries-${language}.json`);
      if (entriesResponse.status === 500) {
        throw new Error('Error fetching entries: ' + entriesResponse.status);
      } else if (entriesResponse.status === 200) {
        entriesJson = await entriesResponse.json();
      }

      const globalsResponse = await fetch(`${apiURL}/globals-${language}.json`);
      if (globalsResponse.status === 500) {
        throw new Error('Error fetching globals: ' + globalsResponse.status);
      } else if (globalsResponse.status === 200) {
        globalsJson = await globalsResponse.json();
      }

      const assetsResponse = await fetch(`${apiURL}/assets.json`);
      if (assetsResponse.status === 500) {
        throw new Error('Error fetching assets: ' + assetsResponse.status);
      } else if (assetsResponse.status === 200) {
        assetsJson = await assetsResponse.json();
      }
    } catch (error) {
      console.log(error);
    }
    return {
      pages: entriesJson.data,
      globals: globalsJson.data[0],
      assets: assetsJson.data
    };
  });

  const data = await Promise.all(requests);

  await createFolder(buildDestination);

  await asyncForEach(languages, async (language, index) => {
    const mappedPages = mapPages(data[index].pages, data[index].globals);
    renderSite(language, mappedPages);

    await rateLimiter(data[index].assets, async asset => await storeAsset(language, asset), assetFetchConcurrencyLimit);
  });
}

function mapPages(pages, globals) {
  const homepage = pages.find(page => page.type === 'home');
  homepage.url = '';
  homepage.localeUrl = '';

  const remainingPages = pages.filter(page => page.url);
  const license = globals.license;
  const footerLinks = globals.footerLinks;
  const persistentLinks = globals.persistentLinks;
  const ctaContent = globals.cta;
  const guidancePanel = globals.guidancePanel;
  const requestCode = globals.requestCode;
  const gStrings = globals.strings.reduce((result, current) => ({ ...result, ...current }));

  remainingPages.forEach(page => {
    page.breadcrumbs.unshift({ url: '/', text: homepage.title });
    page.breadcrumbs.push({ text: page.title, current: true });
    page.relatedLinks.push(...persistentLinks);
  });

  pages = [homepage, ...remainingPages];
  const navigation = pages
    .filter(page => page.level === '1' || page.type === 'home')
    .map(page => ({ title: page.title, url: `/${page.url}` }));
  return pages.map(page => ({
    ...page,
    navigation,
    footerLinks,
    license,
    requestCode,
    guidancePanel,
    ctaContent,
    gStrings,
    enSite,
    cySite
  }));
}

async function renderSite(key, pages) {
  const siteFolder = `${buildDestination}/${key}`;
  asyncForEach(pages, page => renderPage(siteFolder, page));
}

function renderPage(siteFolder, page) {
  return new Promise(resolve => {
    nunjucks.compile(`{% extends "${page.type}.html" %}`, nunjucksEnvironment).render(page, async (error, result) => {
      if (error) {
        throw new Error(error);
      }

      const folderPath = page.url ? `${siteFolder}/${page.url}` : siteFolder;

      await createFolder(folderPath);

      const html = minify(result, {
        removeComments: true,
        collapseWhitespace: true
      });

      await fs.writeFileSync(`${folderPath}/index.html`, html, 'utf8');

      resolve();
    });
  });
}

function storeAsset(key, asset) {
  return new Promise(resolve => {
    const url = assetURL + asset.url;

    getAsset(url)
      .then(async data => {
        fs.writeFileSync(`${buildDestination}/${key}/${asset.url}`, data);

        resolve();
      })
      .catch(error => {
        throw new Error(error);
      });
  });
}

async function run() {
  await removeFolder(buildDestination);
  getContent();
}

run();
