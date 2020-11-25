import * as fs from 'fs';
import { minify } from 'html-minifier';
import nunjucks from 'nunjucks';
import nunjucksDate from 'nunjucks-date';

import asyncForEach from './async-foreach';
import createFolder from './create-folder';
import mapPages from './map-pages';
import { NunjucksLoader } from './nunjucks-loader';
import removeFolder from './remove-folder';
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

nunjucksDate.setDefaultFormat("Do MMMM YYYY, h:mm:ss a");
nunjucksDate.install(nunjucksEnvironment);

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
  
  const requests = languages.map(async language => {

    try {
     let entriesJson, newsJson, globalsJson, newsSettingsJson;


     const entriesBuffer = await readFile(`${contentPath}/entries-${language}.json`, "utf8");
     entriesJson = JSON.parse(entriesBuffer.toString());

     const newsBuffer = await readFile(`${contentPath}/news-${language}.json`, "utf8");
     newsJson = JSON.parse(newsBuffer.toString());

     const globalsBuffer= await readFile(`${contentPath}/globals-${language}.json`, "utf8");
     globalsJson = JSON.parse(globalsBuffer.toString());

     const newsSettingsBuffer= await readFile(`${contentPath}/news-globals-${language}.json`, "utf8");
     newsSettingsJson = JSON.parse(newsSettingsBuffer.toString());
     newsSettingsJson.data[0].featuredEntry = entriesJson.data.find(entry => entry.id === newsSettingsJson.data[0].featuredEntry);

     await removeFolder(buildDestination);
     
     return {
        pages: entriesJson.data,
        news: newsJson.data[0],
        globals: globalsJson.data[0],
        newsSettings: newsSettingsJson.data[0],
      }; 
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  });

  const data = await Promise.all(requests);

  await createFolder(buildDestination);

  await asyncForEach(languages, async (language, index) => {
    generateNewsPages(data[index]);
  
    const mappedPages = mapPages(data[index].pages, data[index].globals, data[index].newsSettings, enSite, cySite);
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

function generateNewsPages(data) {
  const newsIndexPages = new Array(data.news.paginationMeta.totalPages)
    .fill()
    .map((_, pageIndex) => {
      let url = data.news.url;
      if (pageIndex > 0) {
        url += (pageIndex + 1);
      }
      return {
        ...data.news,
        type: 'news',
        entries: data.news.paginatedEntries[pageIndex],
        pageIndex,
        pageNumber: pageIndex + 1,
        url,
      };
    });

  const categoryIndexPages = data.news.categories
    .map(category => {
      return {
        ...category,
        title: data.news.title,
        subTitle: category.subTitle || category.text,
        type: 'newsTerm',
        entries: data.pages
          .filter(entry => !!entry.categories)
          .filter(entry => entry.categories.some(entryCategory => entryCategory.id === category.id))
          .sort((a, b) => -a.published.localeCompare(b.published)),
        categories: data.news.categories
      };
    });

  const tagIndexPages = data.news.tags
    .map(tag => {
      return {
        ...tag,
        title: data.news.title,
        subTitle: tag.subTitle || tag.text,
        type: 'newsTerm',
        entries: data.pages
          .filter(entry => !!entry.tags)
          .filter(entry => entry.tags.some(entryTag => entryTag.id === tag.id))
          .sort((a, b) => -a.published.localeCompare(b.published)),
        categories: data.news.categories
      };
    });

  for (let entry of data.pages.filter(page => page.type === 'newsArticle')) {
    const newsEntry = data.news.entries.find(newsEntry => newsEntry.id === entry.id);
    entry.breadcrumbs.push({ url: data.newsSettings.newsUrl, text: data.newsSettings.newsSubHeading });
    entry.paginationItems = newsEntry.paginationItems;
  }

  data.pages = [ ...data.pages, ...newsIndexPages, ...categoryIndexPages, ...tagIndexPages ];
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
