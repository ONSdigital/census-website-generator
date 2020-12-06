export function transformPullOneFromArray(sourceData) {
  const flag = "__pull__";
  const pull = (obj) => {
    for (let key in obj) {
      if (obj[key] && typeof obj[key] === "object") {
        if (key.endsWith(flag)) {
          const resolvedKey = key.substr(0, key.length - flag.length);
          obj[resolvedKey] = (obj[key] && obj[key].length !== 0)
            ? obj[key][0]
            : null;
          delete obj[key];
          pull(obj[resolvedKey]);
        }
        else {
          pull(obj[key]);
        }
      }
    }
  };
  pull(sourceData);
}

export function transformLinkRefs(sourceData) {
  const stack = new Set();
  const link = (obj) => {
    stack.add(obj);
    for (let key in obj) {
      if (obj[key] && typeof obj[key] === "object") {
        if (obj[key]._entryRef) {
          obj[key] = sourceData.getEntryById(obj[key]._entryRef);
        }
        else if (obj[key]._categoryRef) {
          obj[key] = sourceData.getCategoryById(obj[key]._categoryRef);
        }
        else if (obj[key]._assetRef) {
          obj[key] = sourceData.getAssetById(obj[key]._assetRef);
        }
        else if (!stack.has(obj[key])) {
          link(obj[key]);
        }
      }
    }
    stack.delete(obj);
  };
  link(sourceData);
}

export function transformBuildIndexes(sourceData) {
  const entryMap = new Map(sourceData.entries.map(item => [ item.id, item ]));
  sourceData.getEntryById = (id) => entryMap.get(id);
  const categoryMap = new Map(sourceData.categories.map(item => [ item.id, item ]));
  sourceData.getCategoryById = (id) => categoryMap.get(id);
  const assetMap = new Map(sourceData.assets.map(item => [ item.id, item ]));
  sourceData.getAssetById = (id) => assetMap.get(id);
}
