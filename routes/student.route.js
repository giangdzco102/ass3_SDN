const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const { getAttendanceHistory } = require('../controllers/student.controller');

// Requires "Authorization: Bearer <JWT_token>"
router.use(verifyToken);

router.get('/:studentId/attendance', getAttendanceHistory);

module.exports = router;
