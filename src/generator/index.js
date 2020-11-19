import * as fs from 'fs';

import nunjucks from 'nunjucks';
import { minify } from 'html-minifier';

import { NunjucksLoader } from './nunjucks-loader';
import removeFolder from './remove-folder';
import createFolder from './create-folder';
import asyncForEach from './async-foreach';
import mapPages from './map-pages';
import storeFiles from './store-files';

const util = require('util');
const readFile = util.promisify(fs.readFile);
const ncp = require('ncp').ncp;

const cwd = process.cwd();
const buildDestination = `${cwd}/dist`;
const viewsPath = `${cwd}/src/views`;

const languages = ['en', 'cy', 'ni'];

const enSite = process.env.EN_SITE;
const cySite = process.env.CY_SITE;

const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const searchPaths = [viewsPath, `${viewsPath}/templates`, `${designSystemPath}`];
const nunjucksLoader = new NunjucksLoader(searchPaths);
const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

if (!('ONS_STATIC_SITE_SOURCE' in process.env)) {
  throw new Error('ONS_STATIC_SITE_SOURCE not set');
}

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

const rootPath = process.env.ONS_STATIC_SITE_SOURCE;
const contentPath = rootPath + "/data";
const assetPath = rootPath + "/assets";

async function getContent() {

  let entriesJson, globalsJson;
  
  const requests = languages.map(async language => {

    try {


     const entriesBuffer = await readFile(`${contentPath}/entries-${language}.json`, "utf8");
     entriesJson = JSON.parse(entriesBuffer.toString());

     const globalsBuffer= await readFile(`${contentPath}/globals-${language}.json`, "utf8");
     globalsJson = JSON.parse(globalsBuffer.toString());

     await removeFolder(buildDestination);
     
     return {
        pages: entriesJson.data,
        globals: globalsJson.data[0]
      }; 
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  });

  const data = await Promise.all(requests);

  await createFolder(buildDestination);

  await asyncForEach(languages, async (language, index) => {
    const mappedPages = mapPages(data[index].pages, data[index].globals,enSite, cySite);
    renderSite(language, mappedPages);

    let destination = `${buildDestination}/${language}`;
    await ncp(assetPath, destination, function (err) {
     if (err) {
        console.error(err);
       process.exit(1);     
     }
    });
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


async function run() {
  getContent();
}

run();

nunjucksEnvironment.addFilter('setAttr', function(dictionary, key, value) {
  dictionary[key] = value;
  return dictionary;
});