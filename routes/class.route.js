const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth.middleware');
const {
    getStudents,
    getAttendanceSummary,
    getAttendances
} = require('../controllers/class.controller');

// Protect ALL endpoints in this router: requires "Authorization: Bearer <JWT_token>"
router.use(verifyToken);

router.get(['/:classID/student', '/:classID/students'], getStudents);
router.get('/:classID/attendance-summary', getAttendanceSummary);
router.get('/:classID/attendances', getAttendances);

module.exports = router;
