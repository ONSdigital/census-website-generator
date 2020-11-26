import * as fs from 'fs';
import { minify } from 'html-minifier';
import moment from 'moment';
import nunjucks from 'nunjucks';

import asyncForEach from './async-foreach';
import createFolder from './create-folder';
import mapPages from './map-pages';
import { NunjucksLoader } from './nunjucks-loader';

const cwd = process.cwd();
const viewsPath = `${cwd}/src/views`;

const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const searchPaths = [viewsPath, `${viewsPath}/templates`, `${designSystemPath}`];
const nunjucksLoader = new NunjucksLoader(searchPaths);
const nunjucksEnvironment = new nunjucks.Environment(nunjucksLoader);

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

nunjucksEnvironment.addFilter('date', (str, format, locale = 'en-gb') => {
  const localMoment = moment(str);
  localMoment.locale(locale);
  return localMoment.format(format);
});

export default async function generate(sourceData, languages, buildDestination) {
  await createFolder(buildDestination);

  await asyncForEach(languages, async (language, index) => {
    generateNewsPages(sourceData[index]);
  
    const mappedPages = mapPages(sourceData[index].pages, language, sourceData[index].globals, sourceData[index].newsSettings, process.env.EN_SITE, process.env.CY_SITE);
    renderSite(language, mappedPages, buildDestination);
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
        categories: data.news.categories,
        breadcrumbs: [
          { url: data.newsSettings.newsUrl, text: data.newsSettings.newsSubHeading },
        ]
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

async function renderSite(key, pages, buildDestination) {
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

nunjucksEnvironment.addFilter('setAttr', function(dictionary, key, value) {
  dictionary[key] = value;
  return dictionary;
});
