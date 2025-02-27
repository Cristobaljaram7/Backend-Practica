

//validar token 

    const jwt = require('jsonwebtoken');
    const jwtSecret = 'your_secret_key';

    // middleware para validar token
    function validateToken(req, res, next) {
        const token = req.headers['authorization'];

        if (!token) return res.status(301).send('No token provided.');

        jwt.verify(token, jwtSecret, (err, decoded) => {
            if (err) return res.status(303).send('Token invalid.');

            req.userId = decoded.id;
            next();
        });
    }