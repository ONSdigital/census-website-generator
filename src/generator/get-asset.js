import https from 'https';

export default function getAsset(url) {
  return new Promise((resolve, reject) => {
    https
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
