const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a password reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // Save the reset token to the user document
    user.resetPasswordToken = resetToken;
    await user.save();

    // Send email with reset link
    const resetUrl = `https://niranjidemo.netlify.app/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  console.log('Received reset password request with token:', token); // Debugging

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debugging

    const user = await User.findById(decoded.id);
    console.log('User found:', user); // Debugging

    if (!user || user.resetPasswordToken !== token) {
      console.log('Invalid or expired token'); // Debugging
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update the password
    user.password = newPassword;
    user.resetPasswordToken = undefined; // Clear the reset token
    await user.save();

    console.log('Password reset successful for user:', user.email); // Debugging
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Error in resetPassword:', err); // Debugging
    res.status(500).json({ message: 'Failed to reset password' });
  }
};