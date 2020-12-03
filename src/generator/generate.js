import fs from "fs-extra";
import { minify } from "html-minifier";
import moment from "moment";
import nunjucks from "nunjucks";

const cwd = process.cwd();
const viewsPath = `${cwd}/src/views`;

const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const searchPaths = [viewsPath, `${viewsPath}/templates`, `${designSystemPath}`];

nunjucks.configure(null, {
  watch: false,
  autoescape: true
});

function createNunjucksEnvironment(sourceData) {
  const nunjucksLoader = new nunjucks.FileSystemLoader(searchPaths);
  const env = new nunjucks.Environment(nunjucksLoader);

  env.addFilter("date", (str, format, locale = "en-gb") => {
    const localMoment = moment(str);
    localMoment.locale(locale);
    return localMoment.format(format);
  });

  env.addFilter("setProperty", (obj, key, value) => {
    obj[key] = value;
    return obj;
  });

  env.addFilter("baseUriFromImageUrl", (imageUrl) => {
    return typeof imageUrl === "string"
      ? sourceData.siteBaseUrl + imageUrl.match(/\/([^\/]+\/)[^/]+$/)[1]
      : null;
  });

  env.addFilter("filenameFromImageUrl", (imageUrl) => {
    return typeof imageUrl === "string"
      ? imageUrl.match(/[^/]+$/)[0]
      : null;
  });

  return env;
}

export default async function generate(sourceData, htmlFixer, buildDestination) {
  await fs.ensureDir(buildDestination);
  await renderSite(sourceData.site, sourceData, htmlFixer, buildDestination);
}

function renderSite(key, sourceData, htmlFixer, buildDestination) {
  const nunjucksEnvironment = createNunjucksEnvironment(sourceData);
  const siteFolder = `${buildDestination}/${key}`;
  return Promise.all(sourceData.entries.map(entry =>
    generateEntry(nunjucksEnvironment, siteFolder, entry, sourceData, htmlFixer)
  ));
}

function generateEntry(nunjucksEnvironment, siteFolder, entry, sourceData, htmlFixer) {
  return new Promise((resolve, reject) => {
    const templateName = entry.typeHandle + ".html";

    const context = {
      ...sourceData,
      entry,
    };

    nunjucksEnvironment.render(templateName, context, async (error, result) => {
      if (error) {
        reject(error);
      }
      const folderPath = entry.url ? `${siteFolder}/${entry.uri}` : siteFolder;

      await fs.ensureDir(folderPath);

      const html = minify(htmlFixer(result), {
        removeComments: true,
        collapseWhitespace: true
      });

      await fs.writeFile(`${folderPath}/index.html`, html, { encoding: "utf8" });
      resolve();
    });
  });
}
