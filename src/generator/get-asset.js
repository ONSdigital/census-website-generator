import http from 'http';

export default function getAsset(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, res => {
        const buffer = [];

        res.on('data', function(chunk) {
          buffer.push(chunk);
        });

        res.on('end', function() {
          const data = Buffer.concat(buffer);

          resolve(data);
        });
      })
      .on('error', reject);
  });
}
