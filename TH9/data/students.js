const students = [
  {
    id: 1,
    name: 'Tran Thi Anh Tuyet',
    email: 'tuyet01@example.com',
    age: 21,
    class: 'CNTT1',
    isDeleted: false
  },
  {
    id: 2,
    name: 'Nguyen Tien',
    email: 'tien02@example.com',
    age: 21,
    class: 'CNTT1',
    isDeleted: false
  },
  {
    id: 3,
    name: 'Lê Hoàng Cường',
    email: 'cuong03@example.com',
    age: 21,
    class: 'CNTT2',
    isDeleted: false
  },
  {
    id: 4,
    name: 'Phạm Thu Dung',
    email: 'dung04@example.com',
    age: 22,
    class: 'CNTT2',
    isDeleted: false
  },
  {
    id: 5,
    name: 'Luong Thanh Vinh',
    email: 'vinh05@example.com',
    age: 18,
    class: 'CNTT3',
    isDeleted: false
  },
  {
    id: 6,
    name: 'Vo Ke Vuong',
    email: 'vuong06@example.com',
    age: 23,
    class: 'CNTT3',
    isDeleted: false
  },
  {
    id: 7,
    name: 'Ngô Minh Khoa',
    email: 'khoa07@example.com',
    age: 24,
    class: 'CNTT4',
    isDeleted: false
  },
  {
    id: 8,
    name: 'Nguyen Vach Tinh',
    email: 'tinh08@example.com',
    age: 20,
    class: 'CNTT4',
    isDeleted: false
  },
  {
    id: 9,
    name: 'Huỳnh Quốc Nam',
    email: 'nam09@example.com',
    age: 25,
    class: 'CNTT5',
    isDeleted: false
  },
  {
    id: 10,
    name: 'Le Tien Sy',
    email: 'sy10@example.com',
    age: 19,
    class: 'CNTT5',
    isDeleted: false
  }
];

let nextId = 11;

function getNextId() {
  return nextId++;
}

module.exports = {
  students,
  getNextId
};