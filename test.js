const short = require('./lib/index');

short.connect('mongodb://localhost/shortdb');

short.connection.on('error', (error) => {
  throw new Error(error);
});

setTimeout(() => {
  short.retrieve('OST-0UaWi')
    .then(res => console.log(res))
    .catch(err => console.log(err));
}, 2000);
