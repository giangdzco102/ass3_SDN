const mongoose = require('mongoose');
const Class = require('../models/Class');
require('../models/Subject');
require('../models/Student');
const Attendance = require('../models/Attendance');

// Validate :classID and load the class; returns null after sending an error response
const findClass = async (req, res) => {
    const { classID } = req.params;
    if (!mongoose.Types.ObjectId.isValid(classID)) {
        res.status(400).json({ message: 'Invalid classID' });
        return null;
    }
    const cls = await Class.findById(classID)
        .populate('subjectId', 'code name credits status')
        .populate('enrollments.studentId', 'studentCode fullName email');
    if (!cls) {
        res.status(404).json({ message: 'Class not found' });
        return null;
    }
    return cls;
};

// GET /api/classes/:classID/student?status=enrolled
const VALID_ENROLLMENT_STATUSES = ['enrolled', 'dropped'];

const getStudents = async (req, res) => {
    try {
        const { classID } = req.params;

        // 1. Validate classID
        if (!mongoose.Types.ObjectId.isValid(classID)) {
            return res.status(400).json({ message: 'Invalid classId' });
        }

        // 2. Validate status (optional, default "enrolled", case-insensitive)
        const rawStatus = req.query.status;
        const status = rawStatus === undefined ? 'enrolled' : String(rawStatus).trim().toLowerCase();
        if (!VALID_ENROLLMENT_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Accepted values: enrolled, dropped' });
        }

        // 3. Class must exist
        const cls = await Class.findById(classID)
            .populate('enrollments.studentId', 'studentCode fullName email');
        if (!cls) {
            return res.status(400).json({ message: 'Class not found' });
        }

        // 4. Only students whose enrollment status matches
        const students = cls.enrollments
            .filter(e => e.status === status && e.studentId)
            .map(e => ({
                studentId: e.studentId._id,
                studentCode: e.studentId.studentCode,
                fullName: e.studentId.fullName,
                email: e.studentId.email
            }));

        return res.status(200).json({
            classId: cls._id,
            className: cls.className,
            status,
            total: students.length,
            students
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/classes/:classID/attendance-summary
const getAttendanceSummary = async (req, res) => {
    try {
        const { classID } = req.params;

        if (!mongoose.Types.ObjectId.isValid(classID)) {
            return res.status(400).json({ message: 'Invalid classId' });
        }

        const cls = await Class.findById(classID)
            .populate('enrollments.studentId', 'studentCode fullName email');
        if (!cls) {
            return res.status(400).json({ message: 'Class not found' });
        }

        // Only students whose enrollment status is ENROLLED
        const enrolled = cls.enrollments.filter(
            e => String(e.status).toLowerCase() === 'enrolled' && e.studentId
        );

        // Attendance records of this class for the enrolled students only
        const attendances = await Attendance.find({
            classId: cls._id,
            studentId: { $in: enrolled.map(e => e.studentId._id) }
        });

        const summary = enrolled.map(e => {
            const records = attendances.filter(a => a.studentId.equals(e.studentId._id));
            const totalSessions = records.length;
            const present = records.filter(a => a.status === 'PRESENT').length;
            const absent = records.filter(a => a.status === 'ABSENT').length;

            // present / totalSessions x 100, rounded to 1 decimal place; 0 when no records
            const attendanceRate = totalSessions === 0
                ? 0
                : Math.round((present / totalSessions) * 100 * 10) / 10;

            return {
                studentId: e.studentId._id,
                studentCode: e.studentId.studentCode,
                fullName: e.studentId.fullName,
                totalSessions,
                present,
                absent,
                attendanceRate,
                warning: attendanceRate < 80 // also true when there are no records (rate = 0)
            };
        });

        return res.status(200).json({
            classId: cls._id,
            className: cls.className,
            totalStudents: summary.length,
            summary
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/classes/:classID/attendances
const getAttendances = async (req, res) => {
    try {
        const cls = await findClass(req, res);
        if (!cls) return;

        const attendances = await Attendance.find({ classId: cls._id })
            .populate('studentId', 'studentCode fullName email')
            .sort({ date: 1 });

        res.status(200).json({
            classId: cls._id,
            className: cls.className,
            total: attendances.length,
            attendances
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStudents, getAttendanceSummary, getAttendances };
