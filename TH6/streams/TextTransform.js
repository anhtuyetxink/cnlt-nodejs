const { Transform } = require("stream");

class TextTransform extends Transform {
  constructor() {
    super();
  }

  _transform(chunk, encoding, callback) {
    try {
      const input = chunk.toString();
      const output = input
        .toUpperCase()
        .replace(/QNU/g, "ĐẠI HỌC QUY NHƠN")
        .replace(/NODEJS/g, "NODE.JS");

      this.push(output);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = TextTransform;