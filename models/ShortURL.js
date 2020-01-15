/**
 * @model ShortURL
 */

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const options = {
  versionKey : false
};

module.exports = function (opt = {}) {
  const ShortURLSchema = new Schema({
    _id        : { type : String, unique: true },
    URL        : { type : String, unique: false },
    hits       : { type : Number, default: 0 },
    created_at : { type : Date, default: Date.now },
    expires_at : { type : Date, default: Date.now },
  }, options);

  return mongoose.model('ShortURL', ShortURLSchema);
};
