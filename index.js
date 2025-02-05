const express = require('express');
const app = express();
const port = 3030;
const db_colection = require('./db.model').colection;
    
app.use(express.json())
app.use(express.urlencoded({extended: false}))

const query = async () => {
    let se = new db_colection({
        "CODE": "1",
        "NOM_ROL": "Ariztia",
        "STATUS": true
    });
    await se.save();
    
    const data = await db_colection.find({});
    return data;
}

app.listen(port, async () => {
    console.log(await query())
    console.log(`└→Port: ${port}`)
});
