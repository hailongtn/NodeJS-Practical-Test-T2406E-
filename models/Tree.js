const mongoose = require('mongoose');
const treeSchema = new mongoose.Schema({
    treename: { type: String, required: true },
    description: { type: String, required: true },
    image: String
});
module.exports = mongoose.model('Tree', treeSchema, 'TreeCollection');
