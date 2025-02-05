const mongoose = require('mongoose')

mongoose.connect(`mongodb://ariztiamantencion:Ariztia2025@cluster0-shard-00-00.lytbs.mongodb.net:27017,cluster0-shard-00-01.lytbs.mongodb.net:27017,cluster0-shard-00-02.lytbs.mongodb.net:27017/?replicaSet=atlas-rggwof-shard-0&ssl=true&authSource=admin`, {
useUnifiedTopology: true,
useNewUrlParser: true
})
.then(db => console.log('|=>DDBB'))
.catch(err => console.error(err));

dbCon = mongoose.connection.useDb('base_de_datos')

module.exports = {
    dbCon
}