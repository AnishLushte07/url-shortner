
const mongoose = require('mongoose');
const { ShortURL } = require('../models/ShortURL');

let connection = mongoose.connection;

module.exports = {
  connection,
  connect,
  generate,
  retrieve,
};

function connect(mongodb) {
  if (!mongodb) throw new Error('Mongo URL not specified');

  if (mongoose.connection.readyState === 0) {
    mongoose.connect(mongodb, { useNewUrlParser: true });
  }
}

function _find(query) {
  return new Promise((resolve, reject) => {
    ShortURL.findOne(query, '_id URL', (err, result) => {
      if (err) return reject(err);

      return resolve(result);
    });
  });
}

function _increamentHits(id) {
  ShortURL.updateOne({ _id: id }, { $inc: { hits: 1 } }, (err) => {
    if (err) console.log(err);
  });
}

async function generate(URL) {
  try {
    if (!URL || typeof URL !== 'string') {
      return Promise.reject({ message: 'Please specify URL to be shortened' });
    }

    const exists = await _find({ URL });

    if (exists) {
      return Promise.resolve({ hash: exists._id });
    }

    const record = new ShortURL({ URL });

    return new Promise((resolve, reject) => {
      record.save(function (err, result) {
        if (err) return reject(err);

        return resolve({ hash: result._id });
      });
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

async function retrieve(hash) {
  try {
    const _id = hash.trim();

    if (!hash) {
      return Promise.reject({ message: 'Please specify hash value.' });
    }

    const result = await _find({ _id });

    if (!result) {
      return Promise.reject({ message: 'No record found.' });
    }

    if (result) {
      _increamentHits(result._id);
      return Promise.resolve(result);
    }
  } catch (err) {
    return Promise.reject(err);
  }
}
