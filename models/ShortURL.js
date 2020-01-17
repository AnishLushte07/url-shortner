/**
 * @model ShortURL
 */

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const options = {
  versionKey : false,
};

module.exports = function() {
  const ShortURLSchema = new Schema({
    _id        : { type : String },
    URL        : { type : String },
    hits       : { type : Number, default: 0 },
    created_at : { type : Date, default: Date.now },
    expires_at : { type : Date, default: null },
  }, options);

  return mongoose.model('ShortURL', ShortURLSchema);
};
