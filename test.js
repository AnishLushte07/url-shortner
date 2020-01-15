const URLShortner = require('./lib/index');

const instance = new URLShortner('mongodb://192.168.0.161/shortdb', (err) => console.log(err));
// short.connect('mongodb://192.168.0.161/shortdb');

/*instance.connection.on('error', (error) => {
  throw new Error(error);
});*/

setTimeout(() => {
  instance.retrieve('001e')
    .then(res => console.log(res))
    .catch(err => console.log(err));
}, 2000);
