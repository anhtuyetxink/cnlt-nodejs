const { Duplex } = require("stream");

class EchoDuplex extends Duplex {
  constructor() {
    super();
    this.data = "";
  }

  _write(chunk, encoding, callback) {
    this.data += `Echo từ hệ thống: ${chunk.toString()}`;
    callback();
  }

  _read(size) {
    if (this.data) {
      this.push(this.data);
      this.data = "";
    }
    this.push(null);
  }
}

module.exports = EchoDuplex;