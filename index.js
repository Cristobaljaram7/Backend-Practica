const express = require('express');
const app = express();
const port = 3333;
const db_colection = require('./db.model').colection;
const morgan = require('morgan')
const cors = require('cors');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Authorization']  // Headers permitidos para la comunicación con el backend.
  }));
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(require('./auth.routes'))

const query = async () => {
    let se = new db_colection({
        "CODE": "",
        "NOM_ROL": "",
        "STATUS": true
    });
    await se.save();
    
    const data = await db_colection.find({});
    return data;
}
app.use('/',require('./auth.routes'))

app.listen(port, async () => {
    // console.log(await query())
    console.log(`└→Port: ${port}`)
});
