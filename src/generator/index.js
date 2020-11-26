import * as fs from 'fs';
import { ncp } from 'ncp';

import createFolder from './create-folder';
import generate from './generate';
import removeFolder from './remove-folder';
import storeFiles from './store-files';

const util = require('util');
const readFile = util.promisify(fs.readFile);

const cwd = process.cwd();
const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const buildDestination = `${cwd}/dist`;

const languages = ['en', 'cy', 'ni'];

if (!('ONS_STATIC_SITE_SOURCE' in process.env)) {
  throw new Error('ONS_STATIC_SITE_SOURCE not set');
}

const rootPath = process.env.ONS_STATIC_SITE_SOURCE;
const sourceDataPath = rootPath + "/data";
const sourceAssetsPath = rootPath + "/assets";

async function getSourceData() {
  const requests = languages.map(async language => {
    try {
     let entriesJson, newsJson, globalsJson, newsSettingsJson;

     const entriesBuffer = await readFile(`${sourceDataPath}/entries-${language}.json`, "utf8");
     entriesJson = JSON.parse(entriesBuffer.toString());

     const newsBuffer = await readFile(`${sourceDataPath}/news-${language}.json`, "utf8");
     newsJson = JSON.parse(newsBuffer.toString());

     const globalsBuffer= await readFile(`${sourceDataPath}/globals-${language}.json`, "utf8");
     globalsJson = JSON.parse(globalsBuffer.toString());

     const newsSettingsBuffer= await readFile(`${sourceDataPath}/news-globals-${language}.json`, "utf8");
     newsSettingsJson = JSON.parse(newsSettingsBuffer.toString());
     newsSettingsJson.data[0].featuredEntry = entriesJson.data.find(entry => entry.id === newsSettingsJson.data[0].featuredEntry);

     await removeFolder(buildDestination);
     
     return {
        pages: entriesJson.data,
        news: newsJson.data[0],
        globals: globalsJson.data[0],
        newsSettings: newsSettingsJson.data[0],
      }; 
    }
    catch (error) {
      console.log(error);
      process.exit(1);
    }
  });

  return await Promise.all(requests);
}

async function getSourceAssets() {
  await createFolder(buildDestination);

  for (let language of languages) {
    let destination = `${buildDestination}/${language}`;
    ncp(sourceAssetsPath, destination, function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });

    await storeFiles(designSystemPath, buildDestination, language);
  }
}

(async () => {
  const sourceData = await getSourceData();
  await getSourceAssets();
  await generate(sourceData, languages, buildDestination);
})();
