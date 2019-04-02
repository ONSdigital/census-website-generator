import * as path from 'path';
import express from 'express';
import vhost from 'vhost';
import chalk from 'chalk';

const languages = ['en', 'cy'];

const app = express();
app.set('port', process.env.PORT || 4040);

const port = app.get('port');

languages.forEach(language => {
  const languageApp = express();

  languageApp.use(express.static(path.join(process.cwd(), `/dist/${language}`)));

  app.use(vhost(`${language}.localhost`, languageApp));
});

app.listen(port, () => {
  console.log(chalk.blue.bold('======================================='));
  console.log(chalk.bold.cyan('Server started'));
  languages.forEach(language => {
    console.log(`${chalk.bold.cyan(`${language.toUpperCase()} site:`)} ${chalk.bold.green(`http://${language}.localhost:${port}`)}`);
  });
  console.log(chalk.blue.bold('======================================='));
});
