require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();

// Clave secreta desde variables de entorno
const SECRET_KEY = process.env.SECRET_KEY 

// Definir el esquema del usuario directamente en este archivo
const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Administrador', 'Operario'], default: 'Operario' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { nombre, apellido, email, password } = req.body;

        // Verificar si el email ya está registrado antes de intentar guardarlo
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Usuario ya registrado" });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear un nuevo usuario
        const user = new User({ nombre, apellido, email, password: hashedPassword });
        await user.save();

        res.status(200).json({ message: "Usuario registrado" });
    } catch (err) {
        // Manejar específicamente el error de clave duplicada
        if (err.code === 11000) {
            return res.status(200).json({ message: "Usuario ya registrado" });
        }

        res.status(200).json({ error: err.message });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    console.log("login here")
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(200).json({
                message: "Credenciales inválidas",
                userId: user._id,
                role: user.role,
                token:token,
                success: false,
            });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({
            message: "Autenticado correctamente",
            userId: user._id,
            role: user.role,
            token:token,
            success: true,
        });
    } catch (err) {
        return res.status(200).json({
            message: "Credenciales inválidas",
            userId: null,
            role: null,
            token: null,
            success: false,
        });
    }
});

// Cambiar contraseña
router.post('/change-password', async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: "Contraseña actualizada" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/logout', (req, res) => {
    res.cookie('token', '', { expires: new Date(0) })
    return res.sendStatus(200).json({ message: "Sesión cerrada" });
});

// Obtener datos del usuario actual
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar usuario
router.delete('/delete', async (req, res) => {
    try {
        const { email } = req.body;
        await User.deleteOne({ email });
        res.json({ message: "Usuario eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;