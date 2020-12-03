import escapeStringForRegExp from "./escapeStringForRegExp.js";

export default function createStringReplacer(replacements) {
  const replacementsPattern = Object.keys(replacements)
    .map(escapeStringForRegExp)
    .join("|");
  const replacementsRegex = new RegExp(replacementsPattern, "gi");

  return (str) => (str || "")
    .replace(replacementsRegex, (match) => replacements[match]);
  
}
