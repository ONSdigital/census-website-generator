export default function mapPages(pages, globals, enSite, cySite) {
    let homepage = pages.find(page => page.type === 'home');
    const license = globals.license;
    const footerLinks = globals.footerLinks;
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
      homepage.url = '';
      homepage.localeUrl = '';
      navigation[0].url = homePath;
    } else {
  
      homepage = {
        title: ""
      };
    }
  
    pages.forEach(page => {
      page.breadcrumbs.unshift({ url: homePath, text: homepage.title });
      page.breadcrumbs.push({ text: page.title, current: true });
      page.relatedLinks.push(...persistentLinks);
    });
  
    return pages.map(page => ({
      ...page,
      navigation,
      contact,
      hideLanguageToggle,
      footerLinks,
      license,
      requestCode,
      guidancePanel,
      ctaContent,
      gStrings,
      enSite,
      cySite
    }));
  }