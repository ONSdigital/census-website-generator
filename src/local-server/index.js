import * as path from 'path';
import express from 'express';
import vhost from 'vhost';
import chalk from 'chalk';

export const localPort = 4040;

const languages = ['en', 'cy', 'ni'];

const app = express();
app.set('port', process.env.PORT || localPort);

const port = app.get('port');

languages.forEach(language => {
  if (language === 'ni') {
    app.use(`/${language}`, express.static(path.join(process.cwd(), `/dist/${language}`)));
  } else {
    const languageApp = express();
    languageApp.use(express.static(path.join(process.cwd(), `/dist/${language}`)));
    app.use(vhost(`${language}.localhost`, languageApp));
  }
});

app.listen(port, () => {
  console.log(chalk.blue.bold('======================================='));
  console.log(chalk.bold.cyan('Server started'));
  languages.forEach(language => {
    if (language === 'ni') {
      console.log(`${chalk.bold.cyan(`${language.toUpperCase()} site:`)} ${chalk.bold.green(`http://localhost:${port}/${language}/`)}`);
    } else {
      console.log(`${chalk.bold.cyan(`${language.toUpperCase()} site:`)} ${chalk.bold.green(`http://${language}.localhost:${port}`)}`);
    }
  });
  console.log(chalk.blue.bold('======================================='));
});
