const https = require('https');
const fs = require('fs');

const fetchSvgLink = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/href=[\"'](https?:\/\/[^\s\"']+\.svg)[\"']/i);
        resolve(match ? match[1] : null);
      });
    }).on('error', reject);
  });
};

const main = async () => {
  const urls = [
    'https://uxwing.com/unionpay-card-icon/',
    'https://uxwing.com/master-card-icon/',
    'https://uxwing.com/visa-icon/',
    'https://uxwing.com/elo-card-icon/',
    'https://uxwing.com/jcb-card-icon/',
    'https://uxwing.com/american-express-icon/'
  ];
  for (const url of urls) {
    const svg = await fetchSvgLink(url);
    console.log(url, '=>', svg);
  }
};
main();
