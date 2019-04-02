import * as fs from 'fs';

export default async function createFolder(folderPath) {
  try {
    await fs.mkdirSync(folderPath);
  } catch (error) {
    throw new Error(error);
  }
}
