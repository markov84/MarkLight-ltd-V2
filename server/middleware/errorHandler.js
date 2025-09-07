export function notFound(req, res, next) {
  res.status(404).json({ msg: "Not found" });
}
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Server error";
  if (process.env.NODE_ENV !== "production") {
    console.error("Error:", err);
  }
  res.status(status).json({ msg: message });
}