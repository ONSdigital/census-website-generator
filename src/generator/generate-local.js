import * as fs from 'fs';
import { minify } from 'html-minifier';
import fetch from 'node-fetch';
import nunjucks from 'nunjucks';
import * as path from 'path';
import yargs from 'yargs';

import asyncForEach from './async-foreach';
import createFolder from './create-folder';
import getAsset from './get-asset';
import mapPages from './map-pages';
import { NunjucksLoader } from './nunjucks-loader';
import rateLimiter from './rate-limiter';
import removeFolder from './remove-folder';
import storeFiles from './store-files';

const argv = yargs(process.argv).argv;
const cwd = process.cwd();

const projectPath = argv.project;
const projectConfigPath = path.join(projectPath, 'generator-config.json');
const projectConfig = require(projectConfigPath);

const localPort = 4040;
const enSite = 'http://en.localhost:' + localPort + '/';
const cySite = 'http://cy.localhost:' + localPort + '/';

const assetFetchConcurrencyLimit = 50;
const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const searchPaths = [
  ...projectConfig.templating.paths
    .map(projectRelativePath => path.resolve(projectPath, projectRelativePath)),
  `${cwd}/src/views`,
  `${cwd}/src/views/templates`,
  `${designSystemPath}`
];
const nunjucksLoader = new NunjucksLoader(searchPaths);
const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

const buildDestination = path.resolve(projectPath, projectConfig.templating.outputPath);

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

const statusParam = process.env.CONTENT_STATUS;

let apiURL = 'http://localhost/api';
let assetURL = 'http://localhost/assets/uploads/';

let entriesJson, globalsJson, assetsJson;
async function getContent() {
  
  const requests = projectConfig.site.languages.map(async language => {
    try {
      const entriesResponse = await fetch(`${apiURL}/entries-${language}.json?status=${statusParam}`);
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

  await asyncForEach(projectConfig.site.languages, async (language, index) => {
    const mappedPages = mapPages(data[index].pages, data[index].globals, enSite, cySite);
    renderSite(language, mappedPages);

    await rateLimiter(data[index].assets, async asset => await getAssets(language, asset), assetFetchConcurrencyLimit);
    await storeFiles(designSystemPath, buildDestination, language);
  });

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
        process.exit(1);
        
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

function storeAsset(asset, sourceDes, buildDes) {
  return new Promise(resolve => {
    const url = sourceDes + asset.url;

    getAsset(url)
      .then(async data => {
        fs.writeFileSync(`${buildDes}/${asset.url}`, data);
        
        resolve();
      })
      .catch(error => {
        throw new Error(error);
        process.exit(1);
      });
  
  });
}

async function getAssets(key, asset) {

    const url = assetURL;
  
    if (asset.transforms && asset.transforms.length) {

      asset.transforms.forEach(async(transform) => {
        const folderPath = `${buildDestination}/${key}/${transform.location}`;
        createFolder(folderPath);
        const buildDes = `${buildDestination}/${key}/${transform.location}`;
        const sourceDes = `${url}/${transform.location}/`;
        await storeAsset(asset, sourceDes, buildDes);
      })
    
    } 
    
    const buildDes = `${buildDestination}/${key}`;
    const sourceDes = `${url}`;
    await storeAsset(asset, sourceDes, buildDes);
    

}

async function run() {
  getContent();
}

run();



nunjucksEnvironment.addFilter('setAttr', function(dictionary, key, value) {
  dictionary[key] = value;
  return dictionary;
});
