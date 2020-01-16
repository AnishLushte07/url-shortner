const mongoose = require('mongoose');
const shortUrl = require('../models/ShortURL');
const recordId = require('../models/RecordId');
const { toBase62 } = require('./base62');

function URLShortener(mongodb, onConnectionError, options = {}) {
    if (!mongodb) throw new Error('Mongo URL not specified');

    const { characters, minHashCount, domain } = options;

    if (!domain) throw new Error('Please provide domain, Generated hash will be appended to given domain.');

    if (mongoose.connection.readyState === 0) {
        _connectMongo(mongodb)
            .catch(err => (onConnectionError(err)));

        this.digits = characters || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.len = this.digits.length;
        this.minHashCount = +minHashCount || 4;
        this.domain = domain;

        this.RecordIdModel = recordId();
        _createDefaultRecord(this.RecordIdModel);
        this.ShortURLModel = shortUrl();
    }
}

function _createDefaultRecord(model) {
    model.countDocuments((err, result) => {
        if (err) return console.error(err);

        if (!result) {
            const record = new model({ _id: 0 });
            record.save();
        }
    });
}

function _getRecordId(model) {
    return new Promise((resolve, reject) => {
        const updateQuery = { $inc: { last_index: 1 } };
        model.findOneAndUpdate({ _id: 0 }, updateQuery, { new: true }, (err, result) => {
            if (err) return reject(err);

            return resolve(result);
        });
    });
}

function _connectMongo(url) {
    return new Promise((resolve, reject) => {
        mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        }, (err) => {
            if (err) return reject(err);

            return resolve();
        });
    });
}

function _find(model, query) {
    return new Promise((resolve, reject) => {
        model.findOne(query, '_id URL expires_at', (err, result) => {
            if (err) return reject(err);

            return resolve(result);
        });
    });
}

function _incrementHits(model, id) {
    model.updateOne({
        _id: id,
    }, {
        $inc: {
            hits: 1,
        },
    }, (err) => {
        if (err) console.error(err);
    });
}

URLShortener.prototype.retrieve = function(hash) {
    const _id = hash.trim();

    if (!_id) {
        return Promise.reject({ message: 'Please specify hash value.' });
    }

    return _find(this.ShortURLModel, { _id })
        .then(result => {
            if (!result) {
                return Promise.reject({ statusCode: 404, message: 'No record found.' });
            }

            if (result && result.expires_at < new Date()) {
                return Promise.reject({ statusCode: 409, message: 'URL has expired.' });
            }

            _incrementHits(this.ShortURLModel, result._id);
            return Promise.resolve(result);
        })
        .catch(err => Promise.reject(err));
};

URLShortener.prototype.shortenUrl = function (url, expiry) {
    if (!url || typeof url !== 'string') {
        return Promise.reject({ message: 'Please specify URL to be shortened' });
    }

    return _getRecordId(this.RecordIdModel)
        .then(data => {
            let hash = toBase62(data.last_index, this.digits, this.len);
            const shortUrl = `${this.domain}/${hash}`;

            if (hash.length < this.minHashCount) {
                hash = hash.padStart(this.minHashCount, '0');
            }

            const record = new this.ShortURLModel({
                _id: hash,
                URL: url,
                expires_at: expiry,
            });

            return new Promise((resolve, reject) => {
                record.save(function (err, result) {
                    if (err) return reject(err);

                    return resolve({ url: shortUrl });
                });
            });
        })
        .catch(err => Promise.reject(err));
};

module.exports = URLShortener;
