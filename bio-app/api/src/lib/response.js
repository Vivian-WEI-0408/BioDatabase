function output(options = null, status = 1, msg = '') {
  const result = {
    status,
    options: options || {},
  };

  if (msg) {
    result.msg = msg;
  }

  return result;
}

module.exports = {
  output,
};
