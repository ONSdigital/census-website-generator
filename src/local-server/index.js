import * as path from 'path';
import express from 'express';
import vhost from 'vhost';
import chalk from 'chalk';

import yargs from 'yargs';

export const localPort = 4040;

const argv = yargs(process.argv).argv;

const projectPath = argv.project;
const projectConfigPath = path.join(projectPath, 'generator-config.json');
const projectConfig = require(projectConfigPath);

const app = express();
app.set('port', process.env.PORT || localPort);

const port = app.get('port');

projectConfig.site.languages.forEach(language => {
  if (language === 'ni') {
    app.use(`/${language}`, express.static(path.resolve(projectConfigPath, projectConfig.templating.outputPath, language)));
  } else {
    const languageApp = express();
    languageApp.use(express.static(path.resolve(projectConfigPath, projectConfig.templating.outputPath, language)));
    app.use(vhost(`${language}.localhost`, languageApp));
  }
});

app.listen(port, () => {
  console.log(chalk.blue.bold('======================================='));
  console.log(chalk.bold.cyan('Server started'));
  projectConfig.site.languages.forEach(language => {
    if (language === 'ni') {
      console.log(`${chalk.bold.cyan(`${language.toUpperCase()} site:`)} ${chalk.bold.green(`http://localhost:${port}/${language}/`)}`);
    } else {
      console.log(`${chalk.bold.cyan(`${language.toUpperCase()} site:`)} ${chalk.bold.green(`http://${language}.localhost:${port}`)}`);
    }
  });
  console.log(chalk.blue.bold('======================================='));
});
