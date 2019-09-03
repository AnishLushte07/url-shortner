/**
 * @model ShortURL
 */

const mongoose = require('mongoose');
const shortid = require('shortid');

const Schema = mongoose.Schema;

const options = {
  versionKey : false
};

const ShortURLSchema = new Schema({
  _id        : { type : String, default: shortid.generate },
  URL        : { type : String, unique: false },
  hits       : { type : Number, default: 0 },
  data       : { type : Schema.Types.Mixed },
  created_at : { type : Date, default: Date.now },
}, options);

exports.ShortURL = mongoose.model('ShortURL', ShortURLSchema);
