import * as fs from 'fs';
import fetch from 'node-fetch';

import asyncForEach from './async-foreach';
import createFolder from './create-folder';
import generate from './generate';
import getAsset from './get-asset';
import rateLimiter from './rate-limiter';
import removeFolder from './remove-folder';
import storeFiles from './store-files';

const cwd = process.cwd();
const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const buildDestination = `${cwd}/dist`;

const languages = ['en', 'cy', 'ni'];

const localPort = 4040;
process.env.EN_SITE = 'http://en.localhost:' + localPort + '/';
process.env.CY_SITE = 'http://cy.localhost:' + localPort + '/';

const assetFetchConcurrencyLimit = 50;

const statusParam = process.env.CONTENT_STATUS;

let apiURL = 'http://localhost/api';
let assetBaseUrl = 'http://localhost/assets/uploads/';

async function getSourceData() {
  const requests = languages.map(async language => {
    try {
      let entriesJson, newsJson, globalsJson, newsSettingsJson, assetsJson;

      console.log(`Fetching ${language} entries`);
      const entriesResponse = await fetch(`${apiURL}/entries-${language}.json?status=${statusParam}`);
      if (entriesResponse.status === 500) {
        throw new Error('Error fetching entries: ' + entriesResponse.status);
      }
      else {
        console.log(`Fetching entries ${language} complete`);
      }

      console.log(`Fetching ${language} news`);
      const newsResponse = await fetch(`${apiURL}/news-${language}.json`);
      if (newsResponse.status === 500) {
        throw new Error('Error fetching news: ' + newsResponse.status);
      }
      else {
        console.log(`Fetching news ${language} complete`);
      }

      console.log(`Fetching ${language} globals`);
      const globalsResponse = await fetch(`${apiURL}/globals-${language}.json`);
      if (globalsResponse.status === 500) {
        throw new Error('Error fetching globals: ' + globalsResponse.status);
      }
      else {
        console.log(`Fetching globals ${language} complete`);
      }

      console.log(`Fetching ${language} news settings from news globals`);
      const newsSettingsResponse = await fetch(`${apiURL}/news-globals-${language}.json`);
      if (newsSettingsResponse.status === 500) {
        throw new Error('Error fetching globals: ' + newsSettingsResponse.status);
      }
      else {
        console.log(`Fetching news settings from news globals ${language} complete`);
      }

      console.log(`Fetching assets`);
      const assetsResponse = await fetch(`${apiURL}/assets.json`);
      if (assetsResponse.status === 500) {
        throw new Error('Error fetching assets: ' + assetsResponse.status);
      }
      else {
        console.log(`Fetching assets complete`);
      }

      entriesJson = await entriesResponse.json();
      newsJson = await newsResponse.json();
      newsSettingsJson = await newsSettingsResponse.json();
      globalsJson = await globalsResponse.json();
      assetsJson = await assetsResponse.json();

      newsSettingsJson.data[0].featuredEntry = entriesJson.data.find(entry => entry.id === newsSettingsJson.data[0].featuredEntry);

      await removeFolder(buildDestination);

      return {
        pages: entriesJson.data,
        news: newsJson.data[0],
        globals: globalsJson.data[0],
        newsSettings: newsSettingsJson.data[0],
        assets: assetsJson.data,
      };
    }
    catch (error) {
      console.log(error);
      process.exit(1);
    }
  });

  return await Promise.all(requests);
}

async function getSourceAssets(sourceData) {
  await asyncForEach(languages, async (language, index) => {
    await rateLimiter(sourceData[index].assets, async asset => await getAssets(language, asset), assetFetchConcurrencyLimit);
    await storeFiles(designSystemPath, buildDestination, language);
  });
}

async function getAssets(key, asset) {
  if (asset.transforms && asset.transforms.length) {
    asset.transforms.forEach(async(transform) => {
      const folderPath = `${buildDestination}/${key}/${transform.location}`;
      createFolder(folderPath);
      const buildDes = `${buildDestination}/${key}/${transform.location}`;
      const sourceDes = `${assetBaseUrl}${transform.location}/`;
      const url = sourceDes + asset.url;
      try {
        const data = await getAsset(url);
        fs.writeFileSync(`${buildDes}/${asset.url}`, data);
      }
      catch {
        console.warn(`Could not fetch asset: ${url}`);
      }
    })
  } 
}

(async () => {
  const sourceData = await getSourceData();
  await getSourceAssets(sourceData);
  await generate(sourceData, languages, buildDestination);
})();
