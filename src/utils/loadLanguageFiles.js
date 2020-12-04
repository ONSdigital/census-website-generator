import fs from "fs-extra";
import * as path from "path";

export default async function loadLanguageFiles(languagesPath) {
  const fileNames = (await fs.readdir(languagesPath))
    .filter(fileName => fileName.endsWith(".json"))
    .map(fileName => path.join(languagesPath, fileName));

  const languages = {};
  for (let fileName of fileNames) {
    languages[path.parse(fileName).name] = await fs.readJSON(fileName, { encoding: "utf8" });
  }
  
  return languages;
}
