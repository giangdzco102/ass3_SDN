const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
require('../models/Class');
require('../models/Subject');

// GET /api/students/:studentId/attendance
const getAttendanceHistory = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Validate studentId
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return res.status(400).json({ message: 'Invalid studentId' });
        }

        // 2. Student must exist
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(400).json({ message: 'Student not found' });
        }

        // 3. All attendance records of the student across all classes, newest first
        const records = await Attendance.find({ studentId })
            .populate({
                path: 'classId',
                select: 'className subjectId',
                populate: { path: 'subjectId', select: 'name' }
            })
            .sort({ date: -1 });

        const history = records.map(a => ({
            className: a.classId ? a.classId.className : null,
            subjectName: a.classId && a.classId.subjectId ? a.classId.subjectId.name : null,
            date: a.date,
            status: a.status
        }));

        // Empty array when the student has no attendance records
        return res.status(200).json(history);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { getAttendanceHistory };
