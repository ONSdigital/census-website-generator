import { execSync } from 'child_process';

const commitHash = execSync("git rev-parse HEAD").toString().trim().substr(0, 6);

export default function mapPages(pages, language, globals, newsSettings, enSite, cySite) {
    let homepage = pages.find(page => page.type === 'home');
    const license = globals.license;
    const footer = globals.footer;
    const persistentLinks = globals.persistentLinks ? globals.persistentLinks : '';
    const ctaContent = globals.cta;
    const guidancePanel = globals.guidancePanel;
    const requestCode = globals.requestCode;
    const navigation = globals.mainNavigation;
    const contact = globals.homepageContact;
    const hideLanguageToggle = globals.hideLanguageToggle;
    const gStrings = globals.strings ? globals.strings.reduce((result, current) => ({ ...result, ...current })) : null;
    const homePath = homepage ? homepage.site === 'ni' ? '/ni' : '/' : null;
    if (homepage) {
      homepage.url = homePath;
      homepage.localeUrl = '';
      navigation[0].url = homePath;
    } else {
  
      homepage = {
        title: ""
      };
    }
  
    pages.forEach(page => {
      page.breadcrumbs = page.breadcrumbs || [];
      page.breadcrumbs.unshift({ url: homePath, text: homepage.title });

      page.relatedLinks = page.relatedLinks || [];
      page.relatedLinks.push(...persistentLinks);
    });
  
    return pages.map(page => ({
      ...page,
      generatorHash: commitHash,
      language,
      navigation,
      contact,
      hideLanguageToggle,
      footer,
      newsSettings,
      license,
      requestCode,
      guidancePanel,
      ctaContent,
      gStrings,
      globals,
      enSite,
      cySite
    }));
  }
