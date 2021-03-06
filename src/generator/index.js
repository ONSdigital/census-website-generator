import { execSync } from "child_process";
import dotenv from "dotenv";
import fs from "fs-extra";
import { GraphQLClient } from "graphql-request";
import * as path from "path";

import designSystemPackageJson from "@ons/design-system/package.json";

import sites from "../config/sites.js";
import fetchSitesSourceData from "../data/fetchSitesSourceData.js";
import transformSourceData from "../data/transformSourceData.js";
import assertEnvVariables from "../utils/assertEnvVariables.js";
import createStringReplacer from "../utils/createStringReplacer.js";
import escape from "../utils/escapeStringForRegExp.js";
import generate from "./generate.js";

dotenv.config();

assertEnvVariables([
  "ONS_CRAFT_GRAPHQL_ENDPOINT",
  "ONS_CRAFT_GRAPHQL_AUTH",
  "ONS_STATIC_SITE_SOURCE",
]);

const cwd = process.cwd();
const commitHash = execSync("git rev-parse HEAD").toString().trim().substr(0, 6);
const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const buildDestination = `${cwd}/dist`;

function getSitesSourceData() {
  const client = new GraphQLClient(process.env.ONS_CRAFT_GRAPHQL_ENDPOINT, {
    headers: {
      authorization: process.env.ONS_CRAFT_GRAPHQL_AUTH,
    },
  });

  return fetchSitesSourceData(sites, client);
}

async function getSourceAssets(site) {
  if (process.env.ONS_STATIC_SITE_SOURCE) {
    console.log(`    Copying assets...`);
    await fs.copy(`${process.env.ONS_STATIC_SITE_SOURCE}/assets`, `${buildDestination}/${site}/assets`);
  }

  console.log(`    Copying favicon...`);
  await fs.copy(`${designSystemPath}/favicons/favicon.ico`, `${buildDestination}/${site}/favicon.ico`);

  console.log(`    Copying security.txt...`);
  await fs.ensureDir(`${buildDestination}/${site}/.well-known`);
  await fs.copy(`${cwd}/source/security.txt`, `${buildDestination}/${site}/.well-known/security.txt`);

  console.log(`    Copying design system assets...`);
  await fs.copy(`${designSystemPath}/css`, `${buildDestination}/${site}/css`);
  await fs.copy(`${designSystemPath}/scripts`, `${buildDestination}/${site}/scripts`);
  await fs.copy(`${designSystemPath}/img`, `${buildDestination}/${site}/img`);
  await fs.copy(`${designSystemPath}/fonts`, `${buildDestination}/${site}/fonts`);
}

function getLocalizedUrls(entry, sitesSourceData) {
  return Object.fromEntries(sitesSourceData.map(otherSourceData => 
    [
      otherSourceData.site,
      otherSourceData.entries.find(otherEntry =>
        (otherEntry.typeHandle === "news" && otherEntry.typeHandle === "news") ||
        (otherEntry.typeHandle === "newsTerm" && otherEntry.typeHandle === "newsTerm" && entry.categoryId === otherEntry.categoryId) ||
        (otherEntry.typeHandle === entry.typeHandle && entry.id === otherEntry.id)
      )?.absoluteUrl
    ]
  ));
}

(async () => {
  try {
    const sitesSourceData = await getSitesSourceData();

    console.log("Transforming source data for each language...");
    for (let sourceData of sitesSourceData) {
      console.log(`  ${sourceData.site}...`);
      transformSourceData(sourceData);
      sourceData.generatorHash = commitHash;
      sourceData.designSystemVersion = designSystemPackageJson.version;
    }

    console.log("Cross referencing entries for localization switcher...");
    for (let sourceData of sitesSourceData) {
      console.log(`  ${sourceData.site}...`);
      for (let entry of sourceData.entries) {
        entry.localizedUrls = getLocalizedUrls(entry, sitesSourceData);
      }
    }

    console.log("Removing previous output...");
    await fs.remove(buildDestination);

    console.log("Generating site for each language...");
    for (let sourceData of sitesSourceData) {
      console.log(`  ${sourceData.site}...`);

      await getSourceAssets(sourceData.site);

      const htmlFixer = createStringReplacer({
        "http://storage.googleapis.com/[^/]+/": sourceData.siteBaseUrl,
        [escape(sourceData.craftBaseUrl)]: sourceData.siteBaseUrl,
        [escape("$SITE_BASE_PATH$")]: `${sourceData.rhBaseUrl}`,
        [escape("<table>")]: '<table class="table table--scrollable">',
        [escape("<thead>")]: '<thead class="table__head">',
        [escape("<tbody>")]: '<tbody class="table__body">',
        [escape("<tr>")]: '<tr class="table__row">',
        [escape("<th>")]: '<th scope="col" class="table__header">',
        [escape("<td>")]: '<td class="table__cell">',
      });

      console.log(`    Generating pages...`);
      await generate(sourceData, htmlFixer, path.join(buildDestination, sourceData.site));
    }
  }
  catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
