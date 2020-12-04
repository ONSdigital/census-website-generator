import dotenv from "dotenv";

import assertEnvVariables from "../utils/assertEnvVariables.js";

dotenv.config();

assertEnvVariables([ "EN_SITE", "CY_SITE", "NI_SITE", "EN_BASE_PATH", "CY_BASE_PATH", "NI_BASE_PATH", "CRAFT_BASE_URL" ]);

const sites = [
  {
    name: "en",
    baseUrl: process.env.EN_SITE,
    basePath: process.env.EN_BASE_PATH,
    craftBaseUrl: process.env.CRAFT_BASE_URL,
  },
  {
    name: "ni",
    baseUrl: process.env.NI_SITE,
    basePath: process.env.NI_BASE_PATH,
    craftBaseUrl: process.env.CRAFT_BASE_URL + "ni/",
  },
  {
    name: "cy",
    baseUrl: process.env.CY_SITE,
    basePath: process.env.CY_BASE_PATH,
    craftBaseUrl: process.env.CRAFT_BASE_URL + "cy/",
  },
];

export default sites;
