import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';



//get the current module’s directory in Nodejs modules
const __filename = fileURLToPath(import.meta.url);
//const __dirname = dirname(__filename);

const app = express();

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Message Board Platform API',
    version: '1.0.0',
    documentation: 'See README.md for the full API reference'
  });
});

// Start Server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
