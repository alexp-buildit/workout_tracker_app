const express = require('express');
const Workout = require('../models/Workout');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/workouts
// @desc    Create a new workout
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { username, type, date, startTime, exercises = [] } = req.body;

    // Validation
    if (!username || !type || !date || !startTime) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Username, type, date, and start time are required'
      });
    }

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Create workout
    const workout = await Workout.create({
      userId: user.id,
      username: user.username,
      type: type.toLowerCase(),
      date: new Date(date),
      startTime: new Date(startTime),
      exercises: exercises
    });

    res.status(201).json({
      message: 'Workout created successfully',
      workout: workout
    });

  } catch (error) {
    console.error('Create workout error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.errors[0].message
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create workout'
    });
  }
});

// @route   GET /api/workouts/:username
// @desc    Get all workouts for a user
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 50, startDate, endDate } = req.query;

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Build query
    const whereClause = { userId: user.id };

    // Add date filter if provided
    if (startDate || endDate) {
      const { Op } = require('sequelize');
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }

    // Get workouts with pagination
    const { count, rows: workouts } = await Workout.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const totalWorkouts = count;

    res.status(200).json({
      workouts: workouts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalWorkouts / limit),
        totalWorkouts: totalWorkouts,
        hasNext: page * limit < totalWorkouts,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve workouts'
    });
  }
});

// @route   GET /api/workouts/:username/month/:year/:month
// @desc    Get workouts for specific month
// @access  Public
router.get('/:username/month/:year/:month', async (req, res) => {
  try {
    const { username, year, month } = req.params;

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User does not exist'
      });
    }

    // Get monthly workouts
    const workouts = await Workout.getMonthlyWorkouts(
      user.id,
      parseInt(year),
      parseInt(month)
    );

    // Calculate monthly stats
    const stats = {
      totalWorkouts: workouts.length,
      avgDuration: 0,
      avgRPE: 0,
      daysPerWeek: 0,
      workoutTypes: {}
    };

    if (workouts.length > 0) {
      let totalDuration = 0;
      let durationCount = 0;
      let totalRPE = 0;
      let rpeCount = 0;
      const uniqueDates = new Set();

      workouts.forEach(workout => {
        // Track unique dates
        uniqueDates.add(workout.date.toDateString());

        // Track workout types
        stats.workoutTypes[workout.type] = (stats.workoutTypes[workout.type] || 0) + 1;

        // Calculate duration
        if (workout.duration) {
          totalDuration += workout.duration;
          durationCount++;
        }

        // Calculate RPE
        workout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            if (set.rpe) {
              totalRPE += set.rpe;
              rpeCount++;
            }
          });
        });
      });

      stats.avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
      stats.avgRPE = rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : 0;

      // Calculate days per week (approximate)
      const daysInMonth = new Date(year, month, 0).getDate();
      const weeksInMonth = Math.ceil(daysInMonth / 7);
      stats.daysPerWeek = Math.round((uniqueDates.size / weeksInMonth) * 10) / 10;
    }

    res.status(200).json({
      workouts: workouts,
      stats: stats
    });

  } catch (error) {
    console.error('Get monthly workouts error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve monthly workouts'
    });
  }
});

// @route   PUT /api/workouts/:workoutId
// @desc    Update a workout
// @access  Public
router.put('/:workoutId', async (req, res) => {
  try {
    const { workoutId } = req.params;
    const updateData = req.body;

    // Find and update workout
    const workout = await Workout.findByPk(workoutId);
    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'Workout does not exist'
      });
    }

    // Update fields (excluding protected fields)
    const { id, userId, username, createdAt, updatedAt, ...allowedUpdates } = updateData;
    await workout.update(allowedUpdates);

    res.status(200).json({
      message: 'Workout updated successfully',
      workout: workout
    });

  } catch (error) {
    console.error('Update workout error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.errors[0].message
      });
    }

    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update workout'
    });
  }
});

// @route   DELETE /api/workouts/:workoutId
// @desc    Delete a workout
// @access  Public
router.delete('/:workoutId', async (req, res) => {
  try {
    const { workoutId } = req.params;

    const workout = await Workout.findByPk(workoutId);
    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'Workout does not exist'
      });
    }

    await workout.destroy();

    res.status(200).json({
      message: 'Workout deleted successfully'
    });

  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to delete workout'
    });
  }
});

// @route   PUT /api/workouts/:workoutId/finish
// @desc    Finish a workout
// @access  Public
router.put('/:workoutId/finish', async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { endTime } = req.body;

    const workout = await Workout.findByPk(workoutId);
    if (!workout) {
      return res.status(404).json({
        error: 'Workout not found',
        message: 'Workout does not exist'
      });
    }

    await workout.update({
      endTime: endTime ? new Date(endTime) : new Date()
    });

    res.status(200).json({
      message: 'Workout finished successfully',
      workout: workout
    });

  } catch (error) {
    console.error('Finish workout error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to finish workout'
    });
  }
});

module.exports = router;