const { students, getNextId } = require('../data/students');

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validateStudent(data, currentId = null) {
  const errors = [];

  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const age = Number(data.age);
  const className = String(data.class || '').trim();

  if (name.length < 2) {
    errors.push('name phải có ít nhất 2 ký tự');
  }

  if (!isValidEmail(email)) {
    errors.push('email không đúng định dạng');
  }

  const duplicatedEmail = students.find(
    (student) => student.email.toLowerCase() === email && student.id !== currentId
  );

  if (duplicatedEmail) {
    errors.push('email đã tồn tại');
  }

  if (!Number.isInteger(age) || age < 16 || age > 60) {
    errors.push('age phải từ 16 đến 60');
  }

  if (className.length === 0) {
    errors.push('class không được để trống');
  }

  return {
    errors,
    value: {
      name,
      email,
      age,
      class: className
    }
  };
}

function getActiveStudents() {
  return students.filter((student) => !student.isDeleted);
}

function getAllStudents(req, res) {
  let result = [...getActiveStudents()];

  const { name, class: classQuery, sort } = req.query;

  if (name) {
    const keyword = String(name).trim().toLowerCase();
    result = result.filter((student) =>
      student.name.toLowerCase().includes(keyword)
    );
  }

  if (classQuery) {
    const classKeyword = String(classQuery).trim().toLowerCase();
    result = result.filter(
      (student) => student.class.toLowerCase() === classKeyword
    );
  }

  if (sort === 'age_desc') {
    result.sort((a, b) => b.age - a.age);
  } else if (sort === 'age_asc') {
    result.sort((a, b) => a.age - b.age);
  } else if (sort === 'name_asc') {
    result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } else if (sort === 'name_desc') {
    result.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
  } else {
    result.sort((a, b) => a.id - b.id);
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.max(Number(req.query.limit) || 10, 1);
  const total = result.length;
  const start = (page - 1) * limit;
  const data = result.slice(start, start + limit);

  return res.json({
    page,
    limit,
    total,
    data
  });
}

function getStudentById(req, res) {
  const id = Number(req.params.id);

  const student = students.find(
    (item) => item.id === id && !item.isDeleted
  );

  if (!student) {
    return res.status(404).json({
      message: 'Không tìm thấy sinh viên'
    });
  }

  return res.json(student);
}

function createStudent(req, res) {
  const { errors, value } = validateStudent(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors
    });
  }

  const newStudent = {
    id: getNextId(),
    ...value,
    isDeleted: false
  };

  students.push(newStudent);

  return res.status(201).json({
    message: 'Thêm sinh viên thành công',
    data: newStudent
  });
}

function updateStudent(req, res) {
  const id = Number(req.params.id);

  const student = students.find(
    (item) => item.id === id && !item.isDeleted
  );

  if (!student) {
    return res.status(404).json({
      message: 'Không tìm thấy sinh viên'
    });
  }

  const { errors, value } = validateStudent(req.body, id);

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors
    });
  }

  student.name = value.name;
  student.email = value.email;
  student.age = value.age;
  student.class = value.class;

  return res.json({
    message: 'Cập nhật sinh viên thành công',
    data: student
  });
}

function deleteStudent(req, res) {
  const id = Number(req.params.id);

  const student = students.find(
    (item) => item.id === id && !item.isDeleted
  );

  if (!student) {
    return res.status(404).json({
      message: 'Không tìm thấy sinh viên'
    });
  }

  student.isDeleted = true;
  student.deletedAt = new Date().toISOString();

  return res.json({
    message: 'Xóa mềm sinh viên thành công',
    data: student
  });
}

function getStats(req, res) {
  const total = students.length;
  const activeStudents = students.filter((student) => !student.isDeleted);
  const deletedStudents = students.filter((student) => student.isDeleted);

  const averageAge =
    activeStudents.length > 0
      ? Number(
          (
            activeStudents.reduce((sum, student) => sum + student.age, 0) /
            activeStudents.length
          ).toFixed(1)
        )
      : 0;

  return res.json({
    total,
    active: activeStudents.length,
    deleted: deletedStudents.length,
    averageAge
  });
}

function getStatsByClass(req, res) {
  const activeStudents = students.filter((student) => !student.isDeleted);

  const resultObject = {};

  activeStudents.forEach((student) => {
    if (!resultObject[student.class]) {
      resultObject[student.class] = 0;
    }
    resultObject[student.class]++;
  });

  const result = Object.keys(resultObject).map((className) => ({
    class: className,
    count: resultObject[className]
  }));

  return res.json(result);
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStats,
  getStatsByClass
};