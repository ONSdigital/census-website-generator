export default function escapeStringForRegExp(str) {
  return str.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, "\\$&");
}
