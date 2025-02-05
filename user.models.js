const mongoose = require('mongoose');
    
const userSchema = new mongoose.Schema({
    nombre: {type: String, required: true},
    apellido: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: mongoose.Schema.Types.ObjectId, ref: 'Roles'},
});

const User = mongoose.model('User', userSchema);

module.exports = User;
