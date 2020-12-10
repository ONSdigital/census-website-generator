import dotenv from "dotenv";

import assertEnvVariables from "../utils/assertEnvVariables.js";

dotenv.config();

assertEnvVariables([ "ONS_EN_BASE_URL", "ONS_CY_BASE_URL", "ONS_NI_BASE_URL", "ONS_EN_BASE_PATH", "ONS_CY_BASE_PATH", "ONS_NI_BASE_PATH", "ONS_CRAFT_BASE_URL" ]);

const sites = [
  {
    name: "en",
    baseUrl: process.env.ONS_EN_BASE_URL,
    basePath: process.env.ONS_EN_BASE_PATH,
    craftBaseUrl: process.env.ONS_CRAFT_BASE_URL,
  },
  {
    name: "ni",
    baseUrl: process.env.ONS_NI_BASE_URL,
    basePath: process.env.ONS_NI_BASE_PATH,
    craftBaseUrl: process.env.ONS_CRAFT_BASE_URL + "ni/",
  },
  {
    name: "cy",
    baseUrl: process.env.ONS_CY_BASE_URL,
    basePath: process.env.ONS_CY_BASE_PATH,
    craftBaseUrl: process.env.ONS_CRAFT_BASE_URL + "cy/",
  },
];

export default sites;
