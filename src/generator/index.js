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
const apiURL = 'http://localhost:8888/posts.json';

const searchPaths = [viewsPath, `${viewsPath}/templates`, `${cwd}/node_modules/@ons/design-system`];

const nunjucksLoader = new NunjucksLoader(searchPaths);
const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

async function getPosts() {
  const requests = languages.map(async language => {
    const response = await fetch(`${apiURL}?lang=${language}`);
    const json = await response.json();

    return json.data;
  });
  const pages = await Promise.all(requests);

  await createFolder(buildDestination);

  languages.forEach((language, index) => {
    const mappedPages = mapPages(pages[index]);
    renderSite(language, mappedPages);
  });
}

function mapPages(pages) {
  pages = pages.sort(sortBy('level'));

  const homepage = pages.find(page => !page.url);
  const remainingPages = pages.filter(page => page.url);
  pages = [homepage, ...remainingPages];

  const navigation = pages.filter(page => page.level === '1' && page.url).map(page => ({ title: page.title, url: `/${page.url}` }));
  return pages.map(page => ({ ...page, navigation }));
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
  getPosts();
}

run();
