const express = require('express');
const Vote = require('../models/Vote');
const router = express.Router();

// Get voting results
router.get('/', async (req, res) => {
  try {
    const results = await Vote.aggregate([
      {
        $group: {
          _id: '$candidate',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          candidate: '$_id',
          votes: '$count',
          _id: 0
        }
      }
    ]);

    // Ensure both candidates are always in results
    const allCandidates = [
      { candidate: 'Ahmad Ammad', votes: 0 },
      { candidate: 'Saad Jawad', votes: 0 }
    ];

    results.forEach(result => {
      const index = allCandidates.findIndex(c => c.candidate === result.candidate);
      if (index !== -1) {
        allCandidates[index].votes = result.votes;
      }
    });

    const totalVotes = allCandidates.reduce((sum, candidate) => sum + candidate.votes, 0);

    res.json({
      candidates: allCandidates,
      totalVotes: totalVotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get timeline data for charts
router.get('/timeline', async (req, res) => {
  try {
    // Get votes from last 2 hours for timeline
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const timelineData = await Vote.aggregate([
      {
        $match: {
          votedAt: { $gte: twoHoursAgo }
        }
      },
      {
        $group: {
          _id: {
            candidate: '$candidate',
            timeInterval: {
              $dateToString: {
                format: '%H:%M',
                date: '$votedAt',
                timezone: 'UTC'
              }
            }
          },
          votes: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.timeInterval': 1
        }
      }
    ]);

    // Process timeline data into chart format
    const timeSlots = [];
    const ahmadData = [];
    const saadData = [];

    // Get unique time intervals
    const uniqueTimes = [...new Set(timelineData.map(item => item._id.timeInterval))].sort();
    
    // Initialize data arrays
    uniqueTimes.forEach(time => {
      timeSlots.push(time);
      
      const ahmadVotes = timelineData.find(item => 
        item._id.timeInterval === time && item._id.candidate === 'Ahmad Ammad'
      );
      const saadVotes = timelineData.find(item => 
        item._id.timeInterval === time && item._id.candidate === 'Saad Jawad'
      );
      
      ahmadData.push(ahmadVotes ? ahmadVotes.votes : 0);
      saadData.push(saadVotes ? saadVotes.votes : 0);
    });

    // If no data, create some demo data points
    if (timeSlots.length === 0) {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 15 * 60000);
        timeSlots.push(time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }));
        ahmadData.push(Math.floor(Math.random() * 5));
        saadData.push(Math.floor(Math.random() * 5));
      }
    }

    res.json({
      timeSlots: timeSlots,
      ahmad: ahmadData,
      saad: saadData,
      totalAhmad: ahmadData.reduce((a, b) => a + b, 0),
      totalSaad: saadData.reduce((a, b) => a + b, 0),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline data' });
  }
});

// Get voting statistics for live updates
router.get('/stats', async (req, res) => {
  try {
    // Get total votes per candidate
    const candidateStats = await Vote.aggregate([
      {
        $group: {
          _id: '$candidate',
          totalVotes: { $sum: 1 },
          lastVote: { $max: '$votedAt' }
        }
      }
    ]);

    // Get votes in last 15 minutes for activity
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentActivity = await Vote.aggregate([
      {
        $match: {
          votedAt: { $gte: fifteenMinutesAgo }
        }
      },
      {
        $group: {
          _id: '$candidate',
          recentVotes: { $sum: 1 }
        }
      }
    ]);

    // Format response
    const stats = {
      candidates: candidateStats.map(stat => ({
        candidate: stat._id,
        totalVotes: stat.totalVotes,
        lastVote: stat.lastVote,
        recentVotes: recentActivity.find(act => act._id === stat._id)?.recentVotes || 0
      })),
      totalVotes: candidateStats.reduce((sum, stat) => sum + stat.totalVotes, 0),
      recentTotal: recentActivity.reduce((sum, act) => sum + act.recentVotes, 0),
      timestamp: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch voting statistics' });
  }
});

module.exports = router;