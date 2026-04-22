const express = require("express");
const session = require("express-session");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(
  session({
    secret: "bth-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);


let students = require("./students.json");


function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

app.get("/students/search", (req, res) => {
  const name = req.query.name;

  if (!name) {
    return res.status(400).json({
      message: "Vui long nhap name de tim kiem",
    });
  }

  const result = students.filter((student) =>
    student.name.toLowerCase().includes(name.toLowerCase())
  );

  return res.status(200).json(result);
});


app.get("/students", (req, res) => {
  let result = [...students];

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  if (!isNaN(page) && !isNaN(limit)) {
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        message: "page va limit phai lon hon 0",
      });
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    result = result.slice(start, end);

    return res.status(200).json({
      page,
      limit,
      total: students.length,
      data: result,
    });
  }

  return res.status(200).json(result);
});


app.get("/students/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const student = students.find((s) => s.id === id);

  if (!student) {
    return res.status(404).json({
      message: "Khong tim thay sinh vien",
    });
  }

  return res.status(200).json(student);
});

app.post("/students", (req, res) => {
  const { name, email } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      message: "name khong duoc rong va phai co it nhat 2 ky tu",
    });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      message: "email khong dung dinh dang",
    });
  }

  const isDuplicateEmail = students.some(
    (student) => student.email.toLowerCase() === email.toLowerCase()
  );

  if (isDuplicateEmail) {
    return res.status(400).json({
      message: "email da ton tai",
    });
  }

  const newStudent = {
    id: students.length > 0 ? Math.max(...students.map((s) => s.id)) + 1 : 1,
    name: name.trim(),
    email: email.trim(),
  };

  students.push(newStudent);

  return res.status(201).json({
    message: "Them sinh vien thanh cong",
    student: newStudent,
  });
});


app.put("/students/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email } = req.body;

  const index = students.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Khong tim thay sinh vien",
    });
  }

  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      message: "name khong duoc rong va phai co it nhat 2 ky tu",
    });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      message: "email khong dung dinh dang",
    });
  }

  const isDuplicateEmail = students.some(
    (student) =>
      student.id !== id &&
      student.email.toLowerCase() === email.toLowerCase()
  );

  if (isDuplicateEmail) {
    return res.status(400).json({
      message: "email da ton tai",
    });
  }

  students[index] = {
    id,
    name: name.trim(),
    email: email.trim(),
  };

  return res.status(200).json({
    message: "Cap nhat sinh vien thanh cong",
    student: students[index],
  });
});


app.delete("/students/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const index = students.findIndex((s) => s.id === id);

  if (index === -1) {
    return res.status(404).json({
      message: "Khong tim thay sinh vien",
    });
  }

  const deletedStudent = students[index];
  students.splice(index, 1);

  return res.status(200).json({
    message: "Xoa sinh vien thanh cong",
    student: deletedStudent,
  });
});




app.get("/sync", (req, res) => {
  console.log("Bat dau /sync");

  try {
    const data = fs.readFileSync("./data.txt", "utf8");
    console.log("Ket thuc /sync");

    return res.status(200).json({
      type: "sync",
      message: "Doc file dong bo thanh cong",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Loi doc file dong bo",
      error: error.message,
    });
  }
});


app.get("/async", (req, res) => {
  console.log("Bat dau /async");

  fs.readFile("./data.txt", "utf8", (err, data) => {
    if (err) {
      return res.status(400).json({
        message: "Loi doc file bat dong bo",
        error: err.message,
      });
    }

    console.log("Ket thuc /async");

    return res.status(200).json({
      type: "async",
      message: "Doc file bat dong bo thanh cong",
      data,
    });
  });
});


app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "123456") {
    req.session.user = {
      username: "admin",
    };

    return res.status(200).json({
      message: "Dang nhap thanh cong",
      user: req.session.user,
    });
  }

  return res.status(400).json({
    message: "Sai tai khoan hoac mat khau",
  });
});


app.get("/profile", (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({
      message: "Ban chua dang nhap",
    });
  }

  return res.status(200).json({
    message: "Thong tin profile",
    user: req.session.user,
  });
});


app.get("/logout", (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({
      message: "Ban chua dang nhap de logout",
    });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(400).json({
        message: "Dang xuat that bai",
      });
    }

    return res.status(200).json({
      message: "Dang xuat thanh cong",
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server dang chay tai http://localhost:${PORT}`);
});