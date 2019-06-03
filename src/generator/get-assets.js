import http from 'http';

export default async function getAssets(url, callback) {
  http
    .get(url, res => {
      const bufs = [];

      res.on('data', function(chunk) {
        bufs.push(chunk);
      });

      res.on('end', function() {
        const data = Buffer.concat(bufs);

        callback(null, data);
      });
    })
    .on('error', callback);
}
