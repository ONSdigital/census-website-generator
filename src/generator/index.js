import * as fs from 'fs';

import fetch from 'node-fetch';
import { sortBy } from 'sort-by-typescript';
import nunjucks from 'nunjucks';
import { minify } from 'html-minifier';

import { NunjucksLoader } from './nunjucks-loader';
import removeFolder from './remove-folder';
import createFolder from './create-folder';
import asyncForEach from './async-foreach';

const cwd = process.cwd();
const buildDestination = `${cwd}/dist`;
const viewsPath = `${cwd}/src/views`;
const live_api = process.env.NODE_ENV;

const apiURL = process.env.API_HOST || live_api ? 'https://storage.googleapis.com/census-ci-craftcms' : 'http://localhost/api';

const languages = ['en', 'cy'];

const localPort = 4040;
const enSite = process.env.EN_SITE || 'http://en.localhost:' + localPort + '/';
const cySite = process.env.CY_SITE || 'http://cy.localhost:' + localPort + '/';

const searchPaths = [viewsPath, `${viewsPath}/templates`, `${cwd}/node_modules/@ons/design-system`];
const nunjucksLoader = new NunjucksLoader(searchPaths);
const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

async function getContent() {
  const requests = languages.map(async language => {
    const entriesResponse = await fetch(`${apiURL}/entries-en.json`);
    const entriesJson = await entriesResponse.json();

    // const globalsResponse = await fetch(`${apiURL}/globals-${language}.json`);
    // const globalsJson = await globalsResponse.json();

    return {
      pages: entriesJson.data
      // globals: globalsJson.data ? globalsJson.data[0] : null
    };
  });

  const data = await Promise.all(requests);
  await createFolder(buildDestination);

  languages.forEach((language, index) => {
    const mappedPages = mapPages(data[index].pages, data[index].globals);
    renderSite(language, mappedPages);
  });
}

function mapPages(pages, globals) {
  pages = pages.sort(sortBy('level'));

  const homepage = pages.find(page => page.type === 'home');
  homepage.url = '';
  homepage.localeUrl = '';

  const remainingPages = pages.filter(page => page.url);
  const license = globals ? globals.license : null;
  const footerLinks = globals ? globals.footerLinks : null;

  remainingPages.forEach(page => {
    page.breadcrumbs.unshift({ url: '/', text: homepage.title });
    page.breadcrumbs.push({ text: page.title, current: true });
  });

  pages = [homepage, ...remainingPages];

  const navigation = pages.filter(page => page.level === '1').map(page => ({ title: page.title, url: `/${page.url}` }));
  return pages.map(page => ({ ...page, navigation, footerLinks, license, enSite, cySite }));
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

async function run() {
  await removeFolder(buildDestination);
  getContent();
}

run();
