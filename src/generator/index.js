import dotenv from "dotenv";
import fs from "fs-extra";
import { GraphQLClient } from "graphql-request";

import sites from "../config/sites.js";
import fetchSitesSourceData from "../data/fetchSitesSourceData.js";
import transformSourceData from "../data/transformSourceData.js";
import assertEnvVariables from "../utils/assertEnvVariables.js";
import createStringReplacer from "../utils/createStringReplacer.js";
import generate from "./generate.js";

dotenv.config();

const cwd = process.cwd();
const designSystemPath = `${cwd}/node_modules/@ons/design-system`;
const buildDestination = `${cwd}/dist`;
const assetBaseUrl = "http://localhost/assets/uploads/";

assertEnvVariables([ "CRAFT_GRAPHQL_ENDPOINT", "CRAFT_GRAPHQL_AUTH" ]);

function getSitesSourceData() {
  const client = new GraphQLClient(process.env.CRAFT_GRAPHQL_ENDPOINT, {
    headers: {
      authorization: process.env.CRAFT_GRAPHQL_AUTH,
    },
  });

  return fetchSitesSourceData(sites, client);
}

async function getSourceAssets(site) {
  console.log(`Copying design system assets for ${site.name}...`);
  await fs.copy(sourceAssetsPath, `${buildDestination}/${site.name}`);

  if (process.env.ONS_STATIC_SITE_SOURCE) {
    console.log(`Copying assets for ${site.name}...`);
    await fs.copy(`${designSystemPath}/css`, `${buildDestination}/${language}/css`);
    await fs.copy(`${designSystemPath}/scripts`, `${buildDestination}/${language}/scripts`);
    await fs.copy(`${designSystemPath}/img`, `${buildDestination}/${language}/img`);
    await fs.copy(`${designSystemPath}/fonts`, `${buildDestination}/${language}/fonts`);
  }
}

function getMatchingEntries(entry, sitesSourceData) {
  return Object.fromEntries(sitesSourceData.map(otherSourceData => 
    [
      otherSourceData.site,
      otherSourceData.entries.find(otherEntry =>
        (otherEntry.typeHandle === "news" && otherEntry.typeHandle === "news") ||
        (otherEntry.typeHandle === "newsTerm" && otherEntry.typeHandle === "newsTerm" && entry.categoryId === otherEntry.categoryId) ||
        (otherEntry.typeHandle === entry.typeHandle && entry.id === otherEntry.id)
      )?.url
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
    }

    console.log("Cross referencing entries for localization switcher...");
    for (let sourceData of sitesSourceData) {
      console.log(`  ${sourceData.site}...`);
      for (let entry of sourceData.entries) {
        entry.localizedUrls = getMatchingEntries(entry, sitesSourceData);
      }
    }

    console.log("Removing previous output...");
    await fs.remove(buildDestination);

    console.log("Generating site for each language...");
    for (let sourceData of sitesSourceData) {
      console.log(`  ${sourceData.site}...`);

      //await getSourceAssets(sourceData.site);

      const htmlFixer = createStringReplacer({
        [sourceData.craftBaseUrl]: sourceData.siteBaseUrl.slice(0, -1),
        "<table>": '<table class="table table--scrollable">',
        "<thead>": '<thead class="table__head">',
        "<tbody>": '<tbody class="table__body">',
        "<tr>": '<tr class="table__row">',
        "<th>": '<th scope="col" class="table__header">',
        "<td>": '<td class="table__cell">',
      });

      await generate(sourceData, htmlFixer, buildDestination);
    }
  }
  catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
