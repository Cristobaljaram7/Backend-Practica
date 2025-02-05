const mongoose = require('mongoose');
const { dbCon } = require('./db');

const colection = require('./colection.schema');

const model = {colection: dbCon.model('connections', colection)}


