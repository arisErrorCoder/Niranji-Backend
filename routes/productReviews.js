const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');

// Get reviews for a specific product
router.get('/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', filter } = req.query;
    const skip = (page - 1) * limit;

    let query = { product: req.params.productId };
    
    // Filter by rating if provided
    if (filter && !isNaN(filter)) {
      query.rating = parseInt(filter);
    }

    const reviews = await Review.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get review statistics for a product
router.get('/:productId/stats', async (req, res) => {
  try {
    const stats = await Review.aggregate([
      { $match: { product: mongoose.Types.ObjectId(req.params.productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: {
            $push: '$rating'
          }
        }
      },
      {
        $project: {
          averageRating: { $round: ['$averageRating', 1] },
          totalReviews: 1,
          ratingDistribution: {
            $map: {
              input: [5, 4, 3, 2, 1],
              as: 'r',
              in: {
                rating: '$$r',
                count: {
                  $size: {
                    $filter: {
                      input: '$ratings',
                      as: 'rating',
                      cond: { $eq: ['$$rating', '$$r'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [5, 4, 3, 2, 1].map(r => ({
          rating: r,
          count: 0
        }))
      });
    }

    res.json(stats[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;