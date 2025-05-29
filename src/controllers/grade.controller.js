const Grade = require('../models/grade.model');

const gradeController = {
    getAll: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            // Requête avec pagination
            const grades = await Grade.find()
                .populate('student')
                .populate('course')
                .skip(skip)
                .limit(limit);

            // Nombre total de documents
            const totalDocuments = await Grade.countDocuments();

            // Construction de la réponse
            res.json({
                grades,
                pagination: {
                    totalDocuments,
                    totalPages: Math.ceil(totalDocuments / limit),
                    currentPage: page,
                    pageSize: limit,
                },
            });
        } catch (err) {
            res.status(500).send(err.message);
        }
    },

    getById: async (req, res) => {
        const {id} = req.params;
        try {
            const grade = await Grade.findById(id)
                .populate('student')
                .populate('course');
            res.send(grade);
        } catch (err) {
            res.status(500).send(err.message);
        }
    },

    getByStudentId: async (req, res) => {
        const {id} = req.params;
        try {
            const grades = await Grade.find({student: id})
                .populate('student')
                .populate('course');

            res.status(200).json(grades);
        } catch (err) {
            res.status(500).send(err.message);
        }
    },

    create: async (req, res) => {
        if (!Array.isArray(req.body)) {
            return res.status(400).send('Body should be an array of grade objects');
        }

        try {
            const gradePromises = req.body.map(gradeData => {
                return new Grade({
                    student: gradeData.student,
                    course: gradeData.course,
                    grade: gradeData.grade,
                    date: gradeData.date ? new Date(gradeData.date) : Date.now()
                }).save();
            });

            const grades = await Promise.all(gradePromises);
            const gradeIds = grades.map(grade => grade._id);
            res.json({message: `Grades saved with ids ${gradeIds.join(', ')}!`});
        } catch (err) {
            console.error(err);
            res.status(400).send('Cannot post grades: ' + err.message);
        }
    },

    update: async (req, res) => {
        const {id} = req.params;
        const {student, course, grade, date} = req.body;

        try {
            let updatedGrade = await Grade.findByIdAndUpdate(
                id,
                {student, course, grade, date},
                {new: true, runValidators: true}
            );

            if (!updatedGrade) {
                return res.status(404).send('Grade not found');
            }

            const populatedGrade = await Grade.findById(id)
                .populate('student')
                .populate('course');

            res.json({message: `Grade updated with id ${id}`, grade: populatedGrade});
        } catch (err) {
            res.status(400).send('Cannot update grade: ' + err.message);
        }
    },

    deleteGrade: async (req, res) => {
        const {id} = req.params;

        try {
            const grade = await Grade.findByIdAndDelete(id);
            if (!grade) {
                return res.status(404).send('Grade not found');
            }
            res.json({message: `Grade deleted with id ${id}`});
        } catch (err) {
            res.status(400).send('Cannot delete grade: ' + err.message);
        }
    }
};

module.exports = gradeController;