import { transformBuildIndexes, transformLinkRefs, transformPullOneFromArray } from "./craftTransforms.js";

export default function transformSourceData(sourceData) {
  transformPullOneFromArray(sourceData);

  let nextEntryIdRef = [ -1 ];
  sourceData.generateEntryId = () => nextEntryIdRef[0]--;

  transformCreateNewsListings(sourceData);
  transformBuildIndexes(sourceData);
  transformLinkRefs(sourceData);

  transformGlobal(sourceData);
  transformEntries(sourceData);
  transformCategories(sourceData);
  transformAssets(sourceData);

  //fs.writeFileSync(path.resolve(`./data/data-${sourceData.site}.js`), inspect(sourceData), { encoding: "utf8" });
}


function transformCreateNewsListings(sourceData) {
  const newsSettings = sourceData.globalNews.newsSettings;

  let newsArticleEntries = sourceData.entries
    .filter(entry => entry.typeHandle === "newsArticle");
  if (newsSettings.featuredEntry) {
    newsArticleEntries = newsArticleEntries.filter(entry => entry.id !== newsSettings.featuredEntry._entryRef);
  }

  sourceData.newsCategories = sourceData.categories.filter(category => category.groupHandle === "news");
  sourceData.newsTags = sourceData.categories.filter(category => category.groupHandle === "newsTags");

  const pageCount = Math.ceil(newsArticleEntries.length / newsSettings.numberOfEntriesPerPage);
  const paginatedNewsArticleEntries = new Array(pageCount).fill()
    .map((_, pageIndex) => newsArticleEntries.slice(pageIndex * newsSettings.numberOfEntriesPerPage, (pageIndex + 1) * newsSettings.numberOfEntriesPerPage));

  const newsIndexEntries = paginatedNewsArticleEntries
    .map((articles, pageIndex) => {
      let uri = newsSettings.newsUrl;
      if (pageIndex > 0) {
        uri += (pageIndex + 1);
      }
      return {
        id: sourceData.generateEntryId(),
        typeHandle: "news",
        title: newsSettings.newsSubHeading,
        summary: newsSettings.summary,
        featuredEntry: newsSettings.featuredEntry,
        featuredEntryThumbnail: newsSettings.featuredEntryThumbnail,
        pages: paginatedNewsArticleEntries.map((_, index) => ({
          url: sourceData.siteBaseUrl + newsSettings.newsUrl + (index === 0 ? "" : index + 1),
          current: index === pageIndex,
        })),
        articles,
        pageIndex,
        uri,
      };
    });

  const categoryIndexEntries = sourceData.newsCategories
    .map(category => {
      return {
        ...category,
        id: sourceData.generateEntryId(),
        categoryId: category.id,
        typeHandle: "newsTerm",
        title: newsSettings.newsSubHeading,
        subTitle: category.subTitle || category.title,
        summary: newsSettings.summary,
        parent: { _entryRef: newsIndexEntries[0].id },
        articles: sourceData.entries
          .filter(entry => !!entry.newsCategories)
          .filter(entry => entry.newsCategories.some(entryCategory => entryCategory._categoryRef === category.id)),
      };
    });

  const tagIndexEntries = sourceData.newsTags
    .map(tag => {
      return {
        ...tag,
        id: sourceData.generateEntryId(),
        categoryId: tag.id,
        typeHandle: "newsTerm",
        title: newsSettings.newsSubHeading,
        subTitle: tag.subTitle || tag.title,
        summary: newsSettings.summary,
        parent: { _entryRef: newsIndexEntries[0].id },
        articles: sourceData.entries
          .filter(entry => !!entry.newsTags)
          .filter(entry => entry.newsTags.some(entryCategory => entryCategory._categoryRef === tag.id)),
      };
    });

  sourceData.entries = [ ...sourceData.entries, ...newsIndexEntries, ...categoryIndexEntries, ...tagIndexEntries ];

  const newsArticles = sourceData.entries.filter(entry => entry.typeHandle === "newsArticle");
  for (let i = 0; i < newsArticles.length; ++i) {
    const entry = newsArticles[i];
    entry.parent = { _entryRef: newsIndexEntries[0].id };
    entry.next = newsArticles[i - 1];
    entry.prev = newsArticles[i + 1];
  }
}


function transformGlobal(sourceData) {
  sourceData.global.strings = sourceData.global.global
    .filter(item => item.typeHandle === "textString")
    .reduce((strings, item) => {
      strings[item.key] = item.string;
      return strings;
    }, {});

  sourceData.global.persistentLinks = sourceData.global.global
    .filter(item => item.typeHandle === "persistentLinks")
    .reduce((persistentLinks, item) => {
      persistentLinks.push({
        text: item.linkText,
        url: (item.linkUrl.startsWith("/"))
          ? sourceData.siteBaseUrl + item.linkUrl.substr(1)
          : item.linkUrl,
      });
      return persistentLinks;
    }, []);

  sourceData.global.guidancePanel = sourceData.global.global
    .filter(item => item.typeHandle === "guidancePanel")
    .reduce((guidancePanel, item) => {
      guidancePanel[item.surveyType] = item;
      return guidancePanel;
    }, {});

  const ignoreTypeHandles = [ "textString", "persistentLinks", "guidancePanel" ];
  for (let item of sourceData.global.global) {
    if (!ignoreTypeHandles.includes(item.typeHandle)) {
      sourceData.global[item.typeHandle] = item;
      delete item.typeHandle;
    }
  }

  delete sourceData.global.global;
}


function transformEntries(sourceData) {
  for (let entry of sourceData.entries) {
    if (entry.uri === "__home__") {
      entry.uri = "";
    }
    entry.url = sourceData.siteBaseUrl + entry.uri;
  }
  
  for (let entry of sourceData.entries) {
    transformEntrySetBreadcrumbs(entry, sourceData);
    transformEntryMixinGloballyPersistentLinks(entry, sourceData);
  }
}

function transformEntrySetBreadcrumbs(entry, sourceData) {
  const homeEntry = sourceData.entries.find(entry => entry.typeHandle === "home");

  entry.breadcrumbs = [];
  let parentEntry = entry.parent;
  while (parentEntry) {
    entry.breadcrumbs.unshift({ url: parentEntry.url, text: parentEntry.title });
    parentEntry = parentEntry.parent;
  }
  entry.breadcrumbs.unshift({ url: homeEntry.url, text: homeEntry.title });
}

function transformEntryMixinGloballyPersistentLinks(entry, sourceData) {
  entry.relatedLinks = (entry.relatedLinks || [])
    .map(relatedEntry => ({
      text: relatedEntry.title,
      url: relatedEntry.url,
    }));
  entry.relatedLinks.push(...sourceData.global.persistentLinks);
}


function transformCategories(sourceData) {
  for (let category of sourceData.categories) {
    category.url = sourceData.siteBaseUrl + category.uri;
    category.text = category.title;
  }
}


function transformAssets(sourceData) {
}
