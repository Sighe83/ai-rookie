// CORS middleware for Vercel functions
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-site-mode');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

export function handleCors(req, res, next) {
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Continue to actual handler
  if (next) next();
}

export default handleCors;