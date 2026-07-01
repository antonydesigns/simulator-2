import express from 'express';
import { createServer } from 'http';

const app = express();
app.use(express.static('.'));

const PORT = process.env.PORT || 8080;
createServer(app).listen(PORT, () => {
  console.log(`Grid Sim V2 → http://localhost:${PORT}`);
});
