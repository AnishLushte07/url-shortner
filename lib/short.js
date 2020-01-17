/**
 *  @fileOverview Entry point for getting shortened url for given URL using counter based base62 encoding
 *
 *  @author       Anish Lushte
 *  @author       Darshit Vora
 *
 *  @requires     NPM:mongoose
 */

const mongoose = require('mongoose');
const shortUrl = require('../models/ShortURL');
const counter = require('../models/Counter');
const { toBase62 } = require('./base62');

/**
 * URL Shortener class object
 * Initialize URL Shortener Object
 * @example
 * const URLShortener = require('node-url-shorten');
 *
 * const options = {
 *     characters: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
 *     minHashCount: "4",
 *     domain: "click.com"
 * }
 * const shortUrl = new URLShortener(mongodb, errorCallback, options);
 * @class
 * @constructor
 * @param {object} mongodb connection url
 * @param {function} error callback
 * @param {object}  url shortener configuration object
 */
const URLShortener = function(mongodb, onConnectionError, options = {}) {
    if (!mongodb) throw new Error('Mongo URL not specified');

    const { characters, minHashCount, domain } = options;

    if (!domain) throw new Error('Please provide domain, Generated hash will be appended to given domain.');

    if (mongoose.connection.readyState === 0) {
        _connectMongo(mongodb)
            .catch(err => (onConnectionError(err)));

        this.symbols = characters || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.len = this.symbols.length;
        this.minHashCount = +minHashCount || 4;
        this.domain = domain;

        this.CounterModel = counter();
        _createDefaultRecord(this.CounterModel);
        this.ShortURLModel = shortUrl();
    }
};

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

/**
 * Takes hash string parameters
 * Retrieve actual url from hash
 * @example
 *
 * const shortUrl = new URLShortner('mongodb://192.168.0.161/shortdb', (err) => console.log(err), { domain: 'https:click.com' });
 *
 * shortUrl.retrieve('0004')
 *  .then(res => console.log('res' , res))
 *  .catch(err => console.log(err));
 *
 * @memberof URLShortener
 * @param   {String} hash  shortened url hash
 *
 * @returns {String} returns long url of hash
 */

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

            const isExpired = result.expires_at !== null && result.expires_at < new Date();

            if (result && isExpired) {
                return Promise.reject({ statusCode: 409, message: 'URL has expired.' });
            }

            _incrementHits(this.ShortURLModel, result._id);
            return Promise.resolve(result);
        })
        .catch(err => Promise.reject(err));
};

/**
 * Takes 2 string parameters url and expiry date.
 * Generates and returns shortURL
 * @example
 *
 * const shortUrl = new URLShortner('mongodb://192.168.0.161/shortdb', (err) => console.log(err), { domain: 'https:click.com' });
 *
 * shortUrl.shortenUrl('https://client.example.com/user/1', new Date("2025-02-01"))
 *     .then(res => console.log('res' , res))
 *     .catch(err => console.log(err));
 *
 * @memberof URLShortener
 * @param   {String} url  URL to be shortened
 * @param   {Date} expiry Date when url will expire
 *
 * @returns {object} returns object with shortened url
 */
URLShortener.prototype.shortenUrl = function (url, expiry) {
    if (!url || typeof url !== 'string') {
        return Promise.reject({ message: 'Please specify URL to be shortened' });
    }

    return _getRecordId(this.CounterModel)
        .then(data => {
            let hash = toBase62(data.last_index, this.symbols, this.len);

            if (hash.length < this.minHashCount) {
                hash = hash.padStart(this.minHashCount, '0');
            }

            const record = new this.ShortURLModel({
                _id: hash,
                URL: url,
                expires_at: expiry,
            });

            const shortUrl = `${this.domain}/${hash}`;

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
