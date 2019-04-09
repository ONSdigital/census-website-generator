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

const languages = ['en', 'cy'];
const apiURL = 'http://localhost:8888/';
const entriesEndpoint = 'api/entries.json';
const globalsEndpoint = 'api/globals.json';

const searchPaths = [viewsPath, `${viewsPath}/templates`, `${cwd}/node_modules/@ons/design-system`];

const nunjucksLoader = new NunjucksLoader(searchPaths);
const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

async function getContent() {
  const requests = languages.map(async language => {
    const entriesResponse = await fetch(`${apiURL}${entriesEndpoint}?lang=${language}`);
    const entriesJson = await entriesResponse.json();

    const globalsResponse = await fetch(`${apiURL}${globalsEndpoint}?lang=${language}`);
    const globalsJson = await globalsResponse.json();

    return {
      pages: entriesJson.data,
      globals: globalsJson.data[0]
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

  const homepage = pages.find(page => !page.url);
  const remainingPages = pages.filter(page => page.url);
  const license = globals.license;
  const footerLinks = globals.footerLinks;

  remainingPages.forEach(page => {
    page.breadcrumbs.unshift({ url: '/', text: homepage.title });
    page.breadcrumbs.push({ text: page.title, current: true });
  });

  pages = [homepage, ...remainingPages];

  const navigation = pages.filter(page => page.level === '1' && page.url).map(page => ({ title: page.title, url: `/${page.url}` }));
  return pages.map(page => ({ ...page, navigation, footerLinks, license }));
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
