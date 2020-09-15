
import FileSystem from 'pwd-fs';

export default async function storeFiles(designSystemPath, buildDestination, key) {
    const pfs = new FileSystem();
    const cssPath = `${designSystemPath}/css`;
    const jsPath = `${designSystemPath}/scripts`;
    const imgPath = `${designSystemPath}/img`;
    const fontsPath = `${designSystemPath}/fonts`;
    await pfs.copy(cssPath, `${buildDestination}/${key}/`);
    await pfs.copy(jsPath, `${buildDestination}/${key}/`);
    await pfs.copy(imgPath, `${buildDestination}/${key}/`);
    await pfs.copy(fontsPath, `${buildDestination}/${key}/`);
  }