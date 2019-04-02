import * as fs from 'fs';
import rimraf from 'rimraf';

export default async function removeFolder(folderPath) {
  try {
    if (await fs.existsSync(folderPath)) {
      await rimraf.sync(folderPath);
    }
  } catch (error) {
    throw new Error(error);
  }
}
