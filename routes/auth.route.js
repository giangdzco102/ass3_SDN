const express = require('express');
const router = express.Router();
const { login } = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.post('/login', login);

// Protected test route: returns the decoded token payload
router.get('/me', verifyToken, (req, res) => {
    res.status(200).json({ user: req.user });
});

module.exports = router;
