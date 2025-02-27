const express = require('express');
const app = express();
const port = 3333;
const db_colection = require('./db.model').colection;
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require("cookie-parser");

app.use(cors({
    origin: "http://localhost:5173", // 🔥 Permite solicitudes solo desde el frontend
    credentials: true // 🔥 Permite cookies
}));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 🔥 Desplaza la configuración de rutas después de CORS
app.use(require('./auth.routes'));

// �� Crea un nuevo registro en la base de datos

const query = async () => {
    let se = new db_colection({
        "CODE": "",
        "NOM_ROL": "",
        "STATUS": true
    });
    await se.save();

    // �� Obtiene todos los datos de la base de datos
    
    const data = await db_colection.find({});
    return data;
};

query().then(data => {
    console.log('Data:', data);
});


// �� Crea la ruta para obtener los datos de la base de datos
app.use('/', require('./auth.routes'));


// �� Inicia el server en el puerto 3333
app.listen(port, async () => {
    console.log(`└→Port: ${port}`);
});
