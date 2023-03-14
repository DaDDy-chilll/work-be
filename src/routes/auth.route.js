const router = require('express').Router();

router.post('/register', (req, res) => {
  res.send('User register');
});

router.post('/login', (req, res) => {
  res.send('User login');
});

module.exports = router;
