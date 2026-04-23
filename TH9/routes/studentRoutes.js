const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStats,
  getStatsByClass
} = require('../controllers/studentController');

const router = express.Router();

router.use(authMiddleware);

router.get('/stats/class', getStatsByClass);
router.get('/stats', getStats);

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;