export default function createStringReplacer(replacements) {
  const patterns = Object.keys(replacements);

  let replacementsPattern = "";
  for (let i = 0; i < patterns.length; ++i) {
    if (replacementsPattern !== "") {
      replacementsPattern += "|";
    }
    replacementsPattern += `(?<p${i}>${patterns[i]})`;
  }

  const replacementsRegex = new RegExp(replacementsPattern, "gi");

  return (str) => (str || "")
    .replace(replacementsRegex, function () {
      const groups = arguments[arguments.length - 1];
      const matchedGroup = Object.entries(groups)
        .find(group => group[1] !== undefined);
      const patternIndex = parseInt(matchedGroup[0].substr(1));
      const patternKey = patterns[patternIndex];
      return replacements[patternKey];
    });
}
