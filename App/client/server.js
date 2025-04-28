const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Setup special handling for API routes
app.use('/api/uploads/*', (req, res) => {
  // For PDF files, set correct content type
  if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
  }
  // Forward to the Flask backend
  res.redirect(`http://localhost:5001${req.originalUrl}`);
});

// For all other routes, serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Client server is running on port ${PORT}`);
}); 