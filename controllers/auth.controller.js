const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// POST /api/auth/login
// Body: { "email": "masv@fpt.edu.vn", "password": "masv@123" }
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(401).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const [prefix, domain] = normalizedEmail.split('@');

        // Login accepted with:
        //   - <masv>@fpt.edu.vn  where masv = studentCode (case-insensitive), e.g. se001@fpt.edu.vn
        //   - or the student's real email stored in DB, e.g. anvn@fpt.edu.vn
        const escaped = (prefix || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const student = await Student.findOne({
            $or: [
                { email: normalizedEmail },
                ...(domain === 'fpt.edu.vn'
                    ? [{ studentCode: { $regex: `^${escaped}$`, $options: 'i' } }]
                    : [])
            ]
        });
        if (!student) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Password rule: <masv>@123 where masv = studentCode (case-insensitive), e.g. SE001@123 / se001@123
        // (the real-email prefix is also accepted, e.g. anvn@123)
        const code = student.studentCode.toLowerCase();
        const emailPrefix = student.email.split('@')[0].toLowerCase();
        const [pwPrefix, pwSuffix] = String(password).split('@');
        const validPassword = pwSuffix === '123' &&
            [code, emailPrefix].includes(String(pwPrefix).toLowerCase());
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { studentId: student._id, studentCode: student.studentCode, email: student.email, fullName: student.fullName },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.status(200).json({ message: 'login successfull', token });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { login };
