# URL Shortener
NodeJS module to create aliases (using Base62 conversion) for long url mapped to a unique counter.
Users are redirected to the original URL when they hit these short links.

Want to contribute to url-shortner? Please read `CONTRIBUTING.md`.

#### Technologies used
    - NodeJS
    - MongoDB

Installation
----------------------

URL-Shortener supports stable versions of Node.js 8.11.0 and later. You can install
URL-Shortener in your project's `node_modules` folder.

To install the latest version on npm locally and save it in your package's
`package.json` file:

    npm install --save node-url-shorten

## Usage
+ Initialize URL Shortener Object
```javascript
  const URLShortener = require('node-short-url');
 
  const options = {
      characters: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      minHashCount: "4",
      domain: "click.com"
  }
  const shortUrl = new URLShortener(mongodb, errorCallback, options);
```

+ Shorten URL
```javascript
  const shortUrl = new URLShortner('mongodb://192.168.0.161/shortdb', (err) => console.log(err), { domain: 'https:click.com' });
 
  shortUrl.shortenUrl('https://client.example.com/user/1', new Date("2025-02-01"))
      .then(res => console.log('res' , res))
      .catch(err => console.log(err));
```

+ Retrieve Long URL from hash
```javascript
  const shortUrl = new URLShortner('mongodb://192.168.0.161/shortdb', (err) => console.log(err), { domain: 'https:click.com' });
 
  shortUrl.retrieve('0004')
   .then(res => console.log('res' , res))
   .catch(err => console.log(err));
```

## Documentation 
+ Documentation is available at [URL Shortener Docs](https://darshitvvora.github.io/url-shortner/index.html).

## License

URL Shortener is copyright (c) 2019-present Anish Lushte and
the [contributors to URL Shortener](https://github.com/anishlushte07/url-shortner/graphs/contributors).

URL Shortener is free software, licensed under the MIT License. See the
`LICENSE` file for more details.