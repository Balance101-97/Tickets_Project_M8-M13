// server-main/src/middlewares/errorMiddleware.js
export function asyncHandler(fn) {
  return function asyncWrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundMiddleware(req, res) {
  res.status(404).json({
    error: { message: "Route not found" },
  });
}

export function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || err.status || 500;

  if (status >= 500) {
    console.error("[error]", err);
  } else {
    console.log(`[warn] ${status} - ${err.message}`);
  }

  res.status(status).json({
    error: { message: err.message || "Internal Server Error" },
  });
}

