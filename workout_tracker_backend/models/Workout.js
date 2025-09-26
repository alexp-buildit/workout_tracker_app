const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  weight: {
    type: Number,
    required: true,
    min: [0, 'Weight cannot be negative']
  },
  reps: {
    type: Number,
    required: true,
    min: [1, 'Reps must be at least 1']
  },
  rpe: {
    type: Number,
    min: [1, 'RPE must be between 1 and 10'],
    max: [10, 'RPE must be between 1 and 10'],
    default: null
  }
}, { _id: false });

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true
  },
  equipment: {
    type: String,
    required: [true, 'Equipment type is required'],
    enum: ['dumbbell', 'barbell', 'band', 'cable', 'bodyweight', 'machine'],
    default: 'bodyweight'
  },
  warmupSets: {
    type: Number,
    min: [0, 'Warmup sets cannot be negative'],
    default: 0
  },
  sets: [setSchema]
}, { _id: false });

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: [true, 'Workout type is required'],
    enum: ['push', 'pull', 'legs', 'upper', 'lower', 'other'],
    lowercase: true
  },
  date: {
    type: Date,
    required: [true, 'Workout date is required'],
    index: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: null
  },
  exercises: [exerciseSchema],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
workoutSchema.index({ user: 1, date: -1 });
workoutSchema.index({ username: 1, date: -1 });
workoutSchema.index({ type: 1, date: -1 });
workoutSchema.index({ 'exercises.name': 1 });
workoutSchema.index({ createdAt: -1 });

// Virtual for calculating duration
workoutSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  return null;
});

// Pre-save middleware to calculate duration
workoutSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
    this.isCompleted = true;
  }

  next();
});

// Static method to get user's workouts for a specific month
workoutSchema.statics.getMonthlyWorkouts = function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

// Static method to get exercise analytics
workoutSchema.statics.getExerciseAnalytics = function(userId, exerciseName, equipment = null) {
  const matchStage = {
    user: userId,
    'exercises.name': { $regex: exerciseName, $options: 'i' }
  };

  if (equipment) {
    matchStage['exercises.equipment'] = equipment;
  }

  return this.aggregate([
    { $match: matchStage },
    { $unwind: '$exercises' },
    { $match: { 'exercises.name': { $regex: exerciseName, $options: 'i' } } },
    { $unwind: '$exercises.sets' },
    {
      $group: {
        _id: null,
        maxWeight: { $max: '$exercises.sets.weight' },
        totalVolume: { $sum: { $multiply: ['$exercises.sets.weight', '$exercises.sets.reps'] } },
        timesPerformed: { $sum: 1 },
        avgRPE: { $avg: '$exercises.sets.rpe' },
        sets: {
          $push: {
            date: '$date',
            equipment: '$exercises.equipment',
            exerciseName: '$exercises.name',
            weight: '$exercises.sets.weight',
            reps: '$exercises.sets.reps',
            rpe: '$exercises.sets.rpe'
          }
        }
      }
    }
  ]);
};

// Instance method to add exercise
workoutSchema.methods.addExercise = function(exerciseData) {
  this.exercises.push(exerciseData);
  return this.save();
};

// Instance method to finish workout
workoutSchema.methods.finishWorkout = function() {
  this.endTime = new Date();
  this.isCompleted = true;
  return this.save();
};

// Transform output
workoutSchema.methods.toJSON = function() {
  const workout = this.toObject();
  workout.id = workout._id;
  delete workout._id;
  delete workout.__v;
  return workout;
};

const Workout = mongoose.model('Workout', workoutSchema);

module.exports = Workout;