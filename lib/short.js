const mongoose = require('mongoose');
const shortUrl = require('../models/ShortURL');
const { toBase62 } = require('./base62');

function URLShortner(mongodb, onConnectionError, options = {}) {
    if (!mongodb) throw new Error('Mongo URL not specified');

    if (mongoose.connection.readyState === 0) {
        _connectMongo(mongodb)
            .catch(err => (onConnectionError(err)));

        const { characters, minHashCount, expiryDays, domain } = options;

        this.digits = characters || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.len = this.digits.length;
        this.minHashCount = +minHashCount || 4;
        this.domain = domain;

        this.ShortURLModel = shortUrl({ expiryDays: expiryDays || 60 });
    }
}

function _connectMongo(url) {
    return new Promise((resolve, reject) => {
        mongoose.connect(url, { useNewUrlParser: true }, (err) => {
            if (err) return reject(err);

            return resolve();
        });
    });
}

function _find(model, query) {
    return new Promise((resolve, reject) => {
        model.findOne(query, '_id URL', (err, result) => {
            if (err) return reject(err);

            return resolve(result);
        });
    });
}

function _increamentHits(model, id) {
    model.updateOne({
        _id: id,
    }, {
        $inc: {
            hits: 1,
        },
    }, (err) => {
        if (err) console.log(err);
    });
}

URLShortner.prototype.retrieve = function(hash) {
    const _id = hash.trim();

    if (!hash) {
        return Promise.reject({ message: 'Please specify hash value.' });
    }

    return _find(this.ShortURLModel, { _id })
        .then(result => {
            if (!result) {
                return Promise.reject({ message: 'No record found.' });
            }

            if (result) {
                _increamentHits(this.ShortURLModel, result._id);
                return Promise.resolve(result);
            }
        })
        .catch(err => Promise.reject(err));
};

URLShortner.prototype.shortenUrl = function (url, expiry) {
    if (!url || typeof url !== 'string') {
        return Promise.reject({ message: 'Please specify URL to be shortened' });
    }

    let hash = toBase62(Math.floor(Math.random() * 100), this.digits, this.len);
    const shortUrl = `${this.domain}/${hash}`;

    if (hash.length < this.minHashCount) {
        hash = hash.padStart(this.minHashCount, '0');
    }

    const record = new this.ShortURLModel({ url, _id: hash,  expires_at: expiry });

    return new Promise((resolve, reject) => {
        record.save(function (err, result) {
            if (err) return reject(err);

            return resolve({ url: shortUrl });
        });
    });
};

module.exports = URLShortner;
