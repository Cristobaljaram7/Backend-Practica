const mongoose = require('mongoose');
const { dbCon } = require('./db');

const colection = require('./coleccion.schema');

const model = {colection: dbCon.model('connections', colection)}

module.exports = model;