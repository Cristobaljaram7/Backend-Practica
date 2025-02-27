require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');  // Requiere multer para la carga de archivos
const path = require('path');  // Para gestionar las rutas de archivos
const router = express.Router();

const SECRET_KEY = process.env.SECRET_KEY;

// Configurar multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/'); // Carpeta donde se almacenarán las imágenes
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Renombramos el archivo para evitar colisiones
    }
});

const upload = multer({ storage: storage }); // Crear el middleware para multer

// Definir el esquema del usuario
const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Administrador', 'Operario'], default: 'Operario' },
    imageUrls: [{ type: String }]  // Cambiar a un array de imágenes
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Middleware para verificar token desde headers
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const token = authHeader.split(' ')[1]; // Extraer token después de "Bearer"
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token inválido" });
    }
};

// **Formulario**
const formSchema = new mongoose.Schema({
    descripcion: {type: String, required: true},
    nombre: { type: String, required: true },
    rut: { type: String, required: true },
    email: { type: String, required: false },
    tema: { type: String, required: true },
    area: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    imageUrls: [{ type: String }]  // Cambiar a un array de imágenes para el formulario
}, { timestamps: true });

const Formulario = mongoose.model('Formulario', formSchema);

const formMaquinasSchema = new mongoose.Schema(
    {
      realizadoPor: { type: String, required: true },
      area: { type: String, required: true },
      maquinaEmpresa: { type: String, required: true },
      rutEmpresa: { type: String, required: true },
      empresa: { type: String},
      respuestas: { type: Array, required: true }, // 🔥 Se guardan todas las respuestas del formulario
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
  );
  
  const FormularioMaquinas = mongoose.model("FormularioMaquinas", formMaquinasSchema);
  module.exports = FormularioMaquinas;

// **Registro de usuario**
router.post('/register', async (req, res) => {
    try {
        const { nombre, apellido, email, password } = req.body;

        // Verificar si el email ya está registrado
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Usuario ya registrado" });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = new User({ nombre, apellido, email, password: hashedPassword });
        await user.save();

        res.status(200).json({ message: "Usuario registrado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Login de usuario**
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Credenciales inválidas" });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY);

        res.status(200).json({
            message: "Autenticado correctamente",
            userId: user._id,
            role: user.role,
            token: token,
            success: true,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

// **Obtener datos del usuario actual (requiere token)**
router.get('/datos', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});



// **Formulario - Guardar datos y las imágenes**
router.post('/enviar-formulario', verifyToken, upload.array('image', 3), async (req, res) => {
    try {
        const { descripcion,nombre, rut, email, tema, area, rutEmpresa, empresa } = req.body;
        let imageUrls = [];

        // Verificamos si hay archivos subidos y los agregamos a imageUrls
        if (req.files) {
            req.files.forEach(file => {
                imageUrls.push(`/uploads/${file.filename}`);
            });
        }

        // Validar que 'area' y 'tema' no estén vacíos
        if (!area || !tema) {
            return res.status(400).json({ success: false, message: "El área y el tema son requeridos" });
        }

        // Crear y guardar el nuevo formulario con las imágenes
        const nuevoFormulario = new Formulario({
            descripcion,
            nombre,
            rut,
            email,
            tema,
            rutEmpresa,
            empresa,
            area,
            userId: req.userId,
            imageUrls  // Almacenamos las URLs de las imágenes aquí
        });

        await nuevoFormulario.save();
        res.status(201).json({ success: true, message: "Formulario guardado correctamente" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});



// **Obtener todos los formularios**
router.get('/formularios', verifyToken, async (req, res) => {
    try {
        const formularios = await Formulario.find();
        res.status(200).json({ success: true, data: formularios });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// **Obtener los datos de los formularios enviados para el gráfico**
router.get('/grafico-datos', verifyToken, async (req, res) => {
    try {
      const data = await Formulario.aggregate([
        {
          $group: {
            _id: { area: "$area", tema: "$tema" },  // Agrupamos por el campo 'area' y 'tema'
            count: { $sum: 1 },  // Contamos la cantidad de formularios por área y tema
          },
        },
        { $project: { name: { $concat: ["$_id.area", " - ", "$_id.tema"] }, count: 1, _id: 0 } },  // Proyectamos los resultados como 'name' y 'count'
      ]);
      
      res.json(data);  // Enviamos los datos como respuesta
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
});

// **Logout**
router.post('/logout', (req, res) => {
    res.json({ success: true, message: "Sesión cerrada" });
});

// **Eliminar usuario**
router.delete('/delete', async (req, res) => {
    try {
        const { email } = req.body;
        await User.deleteOne({ email });
        res.json({ message: "Usuario eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// **Guardar un nuevo registro de inspección**
router.post('/formulario-maquinas', verifyToken, async (req, res) => {
    try {
        const { realizadoPor, area, maquinaEmpresa, rutEmpresa, empresa, respuestas } = req.body;

        if (!respuestas || !Array.isArray(respuestas)) {
            return res.status(400).json({ success: false, error: "Formato de respuestas incorrecto" });
        }

        const nuevoFormulario = new FormularioMaquinas({
            realizadoPor,
            area,
            maquinaEmpresa,
            rutEmpresa,
            empresa,
            respuestas, // 🔥 Ahora guardamos todas las respuestas del formulario
            userId: req.userId
        });

        await nuevoFormulario.save();
        res.status(201).json({ success: true, message: "Formulario de máquinas guardado correctamente" });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});


// **Obtener todos los registros de inspección**
router.get('/formulario-maquinas', verifyToken, async (req, res) => {
    try {
        const formularios = await FormularioMaquinas.find().populate('userId', 'nombre apellido email');
        res.status(200).json({ success: true, data: formularios });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// Endpoint para servir las imágenes cargadas
router.get('/uploads/:filename', (req, res) => {
    const file = path.join(__dirname, 'uploads', req.params.filename);
    res.sendFile(file);  // Sirve la imagen desde la carpeta uploads
});

module.exports = router;
