import dotenv from "dotenv";

import assertEnvVariables from "../utils/assertEnvVariables.js";

dotenv.config();

assertEnvVariables([
  "ONS_EN_ABSOLUTE_BASE_URL",
  "ONS_CY_ABSOLUTE_BASE_URL",
  "ONS_NI_ABSOLUTE_BASE_URL",
  "ONS_EN_BASE_URL",
  "ONS_CY_BASE_URL",
  "ONS_NI_BASE_URL",
  "ONS_CRAFT_BASE_URL",
  "ONS_EN_RH_BASE_URL",
  "ONS_CY_RH_BASE_URL",
  "ONS_NI_RH_BASE_URL",
]);

const sites = [
  {
    name: "en",
    absoluteBaseUrl: process.env.ONS_EN_ABSOLUTE_BASE_URL,
    baseUrl: process.env.ONS_EN_BASE_URL,
    craftBaseUrl: process.env.ONS_CRAFT_BASE_URL,
    rhBaseUrl: process.env.ONS_EN_RH_BASE_URL,
  },
  {
    name: "ni",
    absoluteBaseUrl: process.env.ONS_NI_ABSOLUTE_BASE_URL,
    baseUrl: process.env.ONS_NI_BASE_URL,
    craftBaseUrl: process.env.ONS_CRAFT_BASE_URL + "ni/",
    rhBaseUrl: process.env.ONS_NI_RH_BASE_URL,
  },
  {
    name: "cy",
    absoluteBaseUrl: process.env.ONS_CY_ABSOLUTE_BASE_URL,
    baseUrl: process.env.ONS_CY_BASE_URL,
    craftBaseUrl: process.env.ONS_CRAFT_BASE_URL + "cy/",
    rhBaseUrl: process.env.ONS_CY_RH_BASE_URL,
  },
];

export default sites;
