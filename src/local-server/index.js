import chalk from "chalk";
import dotenv from "dotenv";
import express from "express";
import * as path from "path";

import sites from "../config/sites.js";
import assertEnvVariables from "../utils/assertEnvVariables.js";

dotenv.config();

assertEnvVariables([ "LOCAL_PREVIEW_SERVER_PORT" ]);

const app = express();

for (let site of sites) {
  app.use(`/${site.name}`, express.static(path.join(process.cwd(), `/dist/${site.name}`)));
}

app.listen(process.env.LOCAL_PREVIEW_SERVER_PORT, () => {
  console.log(chalk.blue.bold("======================================="));
  console.log(chalk.bold.cyan("Server started"));
  for (let site of sites) {
    console.log(`${chalk.bold.cyan(`${site.name.toUpperCase()} site:`)} ${chalk.bold.green(site.baseUrl)}`);
  }
  console.log(chalk.blue.bold("======================================="));
});
