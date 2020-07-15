import https from 'https';
import http from 'http';

let protocol = https;
if (process.env.NODE_ENV === 'local') {
  protocol = http;
}
export default function getAsset(url) {
  return new Promise((resolve, reject) => {
    protocol
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
