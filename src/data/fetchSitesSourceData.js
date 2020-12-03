import fetchSourceData from "../data/fetchSourceData.js";

export default async function fetchSitesSourceData(sites, client) {
  console.log(`Fetching source data from '${process.env.CRAFT_GRAPHQL_ENDPOINT}'...`);
  return await Promise.all(sites.map(async site => {
    console.log(`  ${site.name}...`);
    return fetchSourceData(site, client);
  }));
}
