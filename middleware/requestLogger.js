// Prints every incoming request, and how long it took to answer.
function requestLogger(req, res, next) {
  const started = Date.now();

  // "finish" fires once the response has been sent
  res.on("finish", () => {
    const ms = Date.now() - started;
    console.log(
      `${new Date().toISOString()}  ${req.method} ${req.originalUrl}  ` +
      `${res.statusCode}  ${ms}ms`
    );
  });

  next();
}

module.exports = requestLogger;
