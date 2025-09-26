const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Workout = sequelize.define('Workout', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('push', 'pull', 'legs', 'upper', 'lower', 'other'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: true
  },
  exercises: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'workouts',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'date']
    },
    {
      fields: ['username', 'date']
    },
    {
      fields: ['type', 'date']
    },
    {
      fields: ['date']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeSave: (workout) => {
      if (workout.endTime && workout.startTime) {
        workout.duration = Math.round((workout.endTime - workout.startTime) / (1000 * 60));
        workout.isCompleted = true;
      }
    }
  }
});

// Static method to get user's workouts for a specific month
Workout.getMonthlyWorkouts = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return await this.findAll({
    where: {
      userId: userId,
      date: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['date', 'DESC']]
  });
};

// Static method to get exercise analytics
Workout.getExerciseAnalytics = async function(userId, exerciseName, equipment = null) {
  const whereClause = {
    userId: userId
  };

  // Use PostgreSQL JSON operations to filter exercises
  let exerciseFilter = `exercises @> '[{"name": "${exerciseName}"}]'`;

  if (equipment) {
    exerciseFilter = `exercises @> '[{"name": "${exerciseName}", "equipment": "${equipment}"}]'`;
  }

  const workouts = await this.findAll({
    where: {
      ...whereClause,
      [sequelize.Sequelize.Op.and]: [
        sequelize.literal(exerciseFilter)
      ]
    }
  });

  // Process the results to extract analytics
  let maxWeight = 0;
  let totalVolume = 0;
  let timesPerformed = 0;
  let totalRPE = 0;
  let rpeCount = 0;
  const sets = [];

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (exercise.name.toLowerCase().includes(exerciseName.toLowerCase())) {
        if (!equipment || exercise.equipment === equipment) {
          exercise.sets.forEach(set => {
            timesPerformed++;
            maxWeight = Math.max(maxWeight, set.weight || 0);
            totalVolume += (set.weight || 0) * (set.reps || 0);

            if (set.rpe) {
              totalRPE += set.rpe;
              rpeCount++;
            }

            sets.push({
              date: workout.date,
              equipment: exercise.equipment,
              exerciseName: exercise.name,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe
            });
          });
        }
      }
    });
  });

  return [{
    maxWeight,
    totalVolume,
    timesPerformed,
    avgRPE: rpeCount > 0 ? totalRPE / rpeCount : 0,
    sets
  }];
};

// Instance method to finish workout
Workout.prototype.finishWorkout = async function() {
  this.endTime = new Date();
  this.isCompleted = true;
  return await this.save();
};

// Transform output
Workout.prototype.toJSON = function() {
  const values = { ...this.get() };
  return values;
};

module.exports = Workout;