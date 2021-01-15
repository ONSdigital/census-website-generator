const FILE_SIZE_SUFFIXES = [ "B", "KB", "MB", "GB", "TB" ];

export default function convertSizeToHrFormat(sizeInBytes) {
  if (typeof sizeInBytes !== "number" || isNaN(sizeInBytes)) {
    return "";
  }

  let size = sizeInBytes;
  let suffixIndex = 0;
  while (size >= 1024) {
    size /= 1024;
    ++suffixIndex;
  }

  return `${Math.round(size)}${FILE_SIZE_SUFFIXES[suffixIndex]}`;
}
