const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// Mark review as helpful
router.post('/:id/helpful', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already marked as helpful
    if (review.helpfulUsers.includes(req.user.id)) {
      return res.status(400).json({ message: 'You already marked this review as helpful' });
    }

    review.helpfulCount = (review.helpfulCount || 0) + 1;
    review.helpfulUsers.push(req.user.id);
    await review.save();

    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Report a review
router.post('/:id/report', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user already reported
    if (review.reportedBy.includes(req.user.id)) {
      return res.status(400).json({ message: 'You already reported this review' });
    }

    review.reported = true;
    review.reportedBy.push(req.user.id);
    review.reportReason = req.body.reason || 'No reason provided';
    await review.save();

    res.json({ message: 'Review reported successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;