/**
 * @model ShortURL
 */

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const options = {
    versionKey : false
};

module.exports = function () {
    const RecordIdSchema = new Schema({
        _id        : { type : Number, default: 0 },
        last_index : { type: Number, default: 0 },
    }, options);

    return mongoose.model('RecordId', RecordIdSchema);
};
