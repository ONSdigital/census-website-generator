export default function convertSizeToHrFormat(sizeInBytes) {
  if (typeof sizeInBytes !== "number") {
    return "";
  }

  if (1024 > sizeInBytes) {
    return sizeInBytes + "B";
  }
  else if (1048576 > sizeInBytes) {
    return Math.round(sizeInBytes / 1024) + "KB";
  }
  else if (1073741824 > sizeInBytes) {
    return Math.round((sizeInBytes / 1024) / 1024) + "MB";
  }
  else if (1099511627776 > sizeInBytes) {
    return Math.round(((sizeInBytes / 1024) / 1024) / 1024) + "GB";
  }
}
