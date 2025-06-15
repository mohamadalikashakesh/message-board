import express from 'express';

const router = express.Router();


router.get('/', (req, res) => {
  res.send('Welcome to Master Page!');
});

export default router;
