require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();

// Clave secreta desde variables de entorno
const SECRET_KEY = process.env.SECRET_KEY || "supersecreto";

// Definir el esquema del usuario directamente en este archivo
const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { nombre, apellido, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ nombre, apellido, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "Usuario registrado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
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