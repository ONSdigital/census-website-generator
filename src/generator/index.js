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
import FileSystem from 'pwd-fs';

const cwd = process.cwd();
const buildDestination = `${cwd}/dist`;
const viewsPath = `${cwd}/src/views`;

const languages = ['en', 'cy', 'ni'];

const localPort = 4040;
const enSite = process.env.EN_SITE || 'http://en.localhost:' + localPort + '/';
const cySite = process.env.CY_SITE || 'http://cy.localhost:' + localPort + '/';

const assetFetchConcurrencyLimit = 50;
const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const searchPaths = [viewsPath, `${viewsPath}/templates`, `${designSystemPath}`];
const nunjucksLoader = new NunjucksLoader(searchPaths);
const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

// const gcpURL = 'https://storage.googleapis.com/census-ci-craftcms';
// const gcpURL = process.env.CONTENT_SOURCE;
const gcpURL = "https://storage.googleapis.com/census-int-craft-sandbox-craftcms/data";

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
      }

      const globalsResponse = await fetch(`${apiURL}/globals-${language}.json`);
      if (globalsResponse.status === 500) {
        throw new Error('Error fetching globals: ' + globalsResponse.status);
      }

      const assetsResponse = await fetch(`${apiURL}/assets.json`);
      if (assetsResponse.status === 500) {
        throw new Error('Error fetching assets: ' + assetsResponse.status);
      }

      entriesJson = await entriesResponse.json();
      globalsJson = await globalsResponse.json();
      assetsJson = await assetsResponse.json();

      await removeFolder(buildDestination);

      return {
        pages: entriesJson.data,
        globals: globalsJson.data[0],
        assets: assetsJson.data
      };
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  });

  const data = await Promise.all(requests);

  await createFolder(buildDestination);

  await asyncForEach(languages, async (language, index) => {
    const mappedPages = mapPages(data[index].pages, data[index].globals);
    renderSite(language, mappedPages);

    await rateLimiter(data[index].assets, async asset => await storeAsset(language, asset), assetFetchConcurrencyLimit);
    await storeFiles(language);
  });
}

function mapPages(pages, globals) {
  const homepage = pages.find(page => page.type === 'home');
  const license = globals.license;
  const footerLinks = globals.footerLinks;
  const persistentLinks = globals.persistentLinks ? globals.persistentLinks : '';
  const ctaContent = globals.cta;
  const guidancePanel = globals.guidancePanel;
  const requestCode = globals.requestCode;
  const navigation = globals.mainNavigation;
  const contact = globals.homepageContact;
  const hideLanguageToggle = globals.hideLanguageToggle;
  const gStrings = globals.strings ? globals.strings.reduce((result, current) => ({ ...result, ...current })) : null;
  const homePath = homepage.site === 'ni' ? '/ni' : '/';
  if (homepage) {
    homepage.url = '';
    homepage.localeUrl = '';
    navigation[0].url = homePath;
  }

  pages.forEach(page => {
    page.breadcrumbs.unshift({ url: homePath, text: homepage.title });
    page.breadcrumbs.push({ text: page.title, current: true });
    page.relatedLinks.push(...persistentLinks);
  });

  return pages.map(page => ({
    ...page,
    navigation,
    contact,
    hideLanguageToggle,
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
        process.exit(1);
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
        process.exit(1);
        throw new Error(error);
      });
  });
}

async function storeFiles(key) {
  const pfs = new FileSystem();
  const cssPath = `${designSystemPath}/css`;
  const jsPath = `${designSystemPath}/scripts`;
  const imgPath = `${designSystemPath}/img`;
  const fontsPath = `${designSystemPath}/fonts`;
  await pfs.copy(cssPath, `${buildDestination}/${key}/`);
  await pfs.copy(jsPath, `${buildDestination}/${key}/`);
  await pfs.copy(imgPath, `${buildDestination}/${key}/`);
  await pfs.copy(fontsPath, `${buildDestination}/${key}/`);
}

async function run() {
  getContent();
}

run();
