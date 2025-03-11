const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Password routes
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', (req, res) => {
    const { token } = req.params;
    res.render('reset-password', { token }); // Render a reset password form (if using server-side rendering)
  });
  
  // POST request to process the password reset
  router.post('/reset-password',resetPassword);
  
module.exports = router;