const mongoose = require('mongoose');
const shortUrl = require('../models/ShortURL');
const recordId = require('../models/RecordId');
const { toBase62 } = require('./base62');

function URLShortener(mongodb, onConnectionError, options = {}) {
    if (!mongodb) throw new Error('Mongo URL not specified');

    if (mongoose.connection.readyState === 0) {
        _connectMongo(mongodb)
            .catch(err => (onConnectionError(err)));

        const { characters, minHashCount, expiryDays, domain } = options;

        this.digits = characters || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.len = this.digits.length;
        this.minHashCount = +minHashCount || 4;
        this.domain = domain;

        this.RecordIdModel = recordId();
        _createDefaultRecord(this.RecordIdModel);
        this.ShortURLModel = shortUrl({ expiryDays: expiryDays || 60 });
    }
}

function _createDefaultRecord(model) {
    model.count((err, result) => {
        if (err) return console.log(err);

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

URLShortener.prototype.retrieve = function(hash) {
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

            const record = new this.ShortURLModel({ URL: url, _id: hash, expires_at: expiry});

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
