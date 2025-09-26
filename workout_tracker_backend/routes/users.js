const express = require('express');
const User = require('../models/User');
const Workout = require('../models/Workout');
const router = express.Router();

// @route   GET /api/users/:username/analytics/:exerciseName
// @desc    Get exercise analytics for a user
// @access  Public
router.get('/:username/analytics/:exerciseName', async (req, res) => {
  try {
    const { username, exerciseName } = req.params;
    const { equipment } = req.query;

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Get exercise analytics
    const analytics = await Workout.getExerciseAnalytics(
      user.id,
      exerciseName,
      equipment
    );

    if (!analytics || analytics.length === 0) {
      return res.status(200).json({
        message: `No data found for ${exerciseName}`,
        analytics: {
          maxWeight: 0,
          totalVolume: 0,
          timesPerformed: 0,
          avgRPE: 0,
          sets: []
        }
      });
    }

    res.status(200).json({
      exercise: exerciseName,
      equipment: equipment || 'all',
      analytics: {
        maxWeight: analytics[0].maxWeight || 0,
        totalVolume: Math.round(analytics[0].totalVolume * 10) / 10 || 0,
        timesPerformed: analytics[0].timesPerformed || 0,
        avgRPE: analytics[0].avgRPE ? Math.round(analytics[0].avgRPE * 10) / 10 : 0,
        sets: analytics[0].sets || []
      }
    });

  } catch (error) {
    console.error('Get exercise analytics error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve exercise analytics'
    });
  }
});

// @route   GET /api/users/:username/exercises
// @desc    Get all unique exercises for a user
// @access  Public
router.get('/:username/exercises', async (req, res) => {
  try {
    const { username } = req.params;

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Get unique exercises using PostgreSQL JSON operations
    const { sequelize } = require('../config/database');
    const [exercises] = await sequelize.query(`
      SELECT
        exercise->>'name' as name,
        exercise->>'equipment' as equipment,
        COUNT(*) as count,
        MAX(date) as "lastPerformed"
      FROM (
        SELECT
          date,
          json_array_elements(exercises) as exercise
        FROM workouts
        WHERE "userId" = :userId
      ) as flattened
      GROUP BY exercise->>'name', exercise->>'equipment'
      ORDER BY count DESC, name ASC
    `, {
      replacements: { userId: user.id },
      type: sequelize.QueryTypes.SELECT
    });

    res.status(200).json({
      exercises: exercises
    });

  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve exercises'
    });
  }
});

// @route   GET /api/users/:username/stats
// @desc    Get overall user stats
// @access  Public
router.get('/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;
    const { days = 30 } = req.query;

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get workouts for the specified period
    const { Op } = require('sequelize');
    const workouts = await Workout.findAll({
      where: {
        userId: user.id,
        date: {
          [Op.gte]: daysAgo
        }
      },
      order: [['date', 'DESC']]
    });

    // Calculate stats
    const stats = {
      totalWorkouts: workouts.length,
      totalExercises: 0,
      totalSets: 0,
      totalVolume: 0,
      avgWorkoutDuration: 0,
      avgRPE: 0,
      workoutTypes: {},
      equipmentUsage: {},
      topExercises: {},
      weeklyFrequency: Math.round((workouts.length / parseInt(days)) * 7 * 10) / 10
    };

    let totalDuration = 0;
    let durationCount = 0;
    let totalRPE = 0;
    let rpeCount = 0;

    workouts.forEach(workout => {
      // Track workout types
      stats.workoutTypes[workout.type] = (stats.workoutTypes[workout.type] || 0) + 1;

      // Track duration
      if (workout.duration) {
        totalDuration += workout.duration;
        durationCount++;
      }

      // Process exercises
      workout.exercises.forEach(exercise => {
        stats.totalExercises++;

        // Track equipment usage
        stats.equipmentUsage[exercise.equipment] = (stats.equipmentUsage[exercise.equipment] || 0) + 1;

        // Track top exercises
        stats.topExercises[exercise.name] = (stats.topExercises[exercise.name] || 0) + exercise.sets.length;

        // Process sets
        exercise.sets.forEach(set => {
          stats.totalSets++;
          stats.totalVolume += (set.weight * set.reps);

          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        });
      });
    });

    // Calculate averages
    stats.avgWorkoutDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
    stats.avgRPE = rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : 0;
    stats.totalVolume = Math.round(stats.totalVolume * 10) / 10;

    // Convert top exercises to array and sort
    stats.topExercises = Object.entries(stats.topExercises)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, sets: count }));

    res.status(200).json({
      period: `Last ${days} days`,
      stats: stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve user stats'
    });
  }
});

// @route   PUT /api/users/:username/profile
// @desc    Update user profile
// @access  Public
router.put('/:username/profile', async (req, res) => {
  try {
    const { username } = req.params;
    const { phoneNumber } = req.body;

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Update phone number if provided
    if (phoneNumber) {
      // Check if phone number is already used by another user
      const { Op } = require('sequelize');
      const existingPhone = await User.findOne({
        where: {
          phoneNumber: phoneNumber.trim(),
          id: {
            [Op.ne]: user.id
          }
        }
      });

      if (existingPhone) {
        return res.status(409).json({
          error: 'Phone already registered',
          message: 'This phone number is already registered to another account.'
        });
      }

      await user.update({ phoneNumber: phoneNumber.trim() });
    } else {
      // No updates needed, but still return success
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.errors[0].message
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;