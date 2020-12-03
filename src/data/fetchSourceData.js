import fs from "fs-extra";
import * as path from "path";

const query = fs.readFileSync(path.resolve("./src/graphql/dataQuery.gql"), { encoding: "utf8" });

export default async function fetchSourceData(site, client) {
  const sourceData = await client.request(query, {
    "site": site.name,
  });

  sourceData.site = site.name;
  sourceData.siteBaseUrl = site.baseUrl;
  sourceData.siteBasePath = site.basePath;
  sourceData.craftBaseUrl = site.craftBaseUrl;

  return sourceData;
}
