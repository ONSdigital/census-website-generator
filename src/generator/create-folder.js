import * as fs from 'fs';

export default async function createFolder(folderPath) {
  try {
    await fs.mkdirSync(folderPath, { recursive: true });
  } catch (error) {
    throw new Error(error);
  }
}
