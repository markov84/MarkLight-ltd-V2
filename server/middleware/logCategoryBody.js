// Debug middleware to log req.body for category creation
export default function logCategoryBody(req, res, next) {
  if (req.path === '/admin/categories' && req.method === 'POST') {
    console.log('DEBUG CATEGORY BODY:', req.body);
  }
  next();
}
