const mongoose = require('mongoose');
const {Schema} = mongoose;

let roles = new Schema({
  "CODE": { type: String},
  "NOM_ROL": { type: String},
  "STATUS": { type: Boolean},
})

module.exports = roles;