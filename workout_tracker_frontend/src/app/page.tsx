'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';

interface Set {
  weight: number;
  reps: number;
  rpe?: number;
}

interface Exercise {
  name: string;
  equipment: string;
  warmupSets: number;
  sets: Set[];
}

interface Workout {
  id: string;
  type: string;
  date: string;
  startTime?: Date;
  endTime?: Date;
  exercises: Exercise[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function WorkoutTracker() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const user = 'demo_user';

  // Workout form state
  const [workoutType, setWorkoutType] = useState('push');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<Exercise[]>([{
    name: '',
    equipment: 'dumbbell',
    warmupSets: 0,
    sets: [{ weight: 0, reps: 0, rpe: 0 }]
  }]);

  const loadWorkouts = async () => {
    try {
      const response = await axios.get(`${API_URL}/workouts/${user}`);
      setWorkouts(response.data.workouts || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
      // If user doesn't exist, create them first
      if (error.response?.status === 404) {
        await createUser();
        // Try loading workouts again
        try {
          const response = await axios.get(`${API_URL}/workouts/${user}`);
          setWorkouts(response.data.workouts || []);
        } catch {
          toast.error('Failed to load workouts');
        }
      } else {
        toast.error('Failed to load workouts');
      }
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, [user]);

  const createUser = async () => {
    try {
      await axios.post(`${API_URL}/users`, {
        username: user,
        email: `${user}@example.com`,
        password: 'demo123'
      });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const saveWorkout = async () => {
    try {
      const workout = {
        username: user,
        type: workoutType,
        date: workoutDate,
        startTime: new Date().toISOString(),
        exercises: exercises.filter(ex => ex.name.trim() !== '')
      };

      await axios.post(`${API_URL}/workouts`, workout);
      toast.success('Workout saved successfully!');
      setCurrentView('dashboard');
      loadWorkouts();

      // Reset form
      setExercises([{
        name: '',
        equipment: 'dumbbell',
        warmupSets: 0,
        sets: [{ weight: 0, reps: 0, rpe: 0 }]
      }]);
    } catch (error) {
      console.error('Error saving workout:', error);
      toast.error('Failed to save workout');
    }
  };

  const addExercise = () => {
    setExercises([...exercises, {
      name: '',
      equipment: 'dumbbell',
      warmupSets: 0,
      sets: [{ weight: 0, reps: 0, rpe: 0 }]
    }]);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.push({ weight: 0, reps: 0, rpe: 0 });
    setExercises(newExercises);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...exercises];
    (newExercises[index] as Record<string, unknown>)[field] = value;
    setExercises(newExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof Set, value: number) => {
    const newExercises = [...exercises];
    (newExercises[exerciseIndex].sets[setIndex] as Record<string, unknown>)[field] = value;
    setExercises(newExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.splice(setIndex, 1);
    setExercises(newExercises);
  };

  const removeExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-orange-500/20 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-400">💪 Workout Tracker</h1>
          <nav className="flex gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-orange-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setCurrentView('workout')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'workout' ? 'bg-orange-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
            >
              🏋️ New Workout
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center">Your Workouts</h2>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
                <h3 className="text-lg font-semibold">Total Workouts</h3>
                <p className="text-2xl font-bold text-orange-400">{workouts.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
                <h3 className="text-lg font-semibold">This Month</h3>
                <p className="text-2xl font-bold text-orange-400">
                  {workouts.filter(w => new Date(w.date).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
                <h3 className="text-lg font-semibold">Avg Duration</h3>
                <p className="text-2xl font-bold text-orange-400">60m</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
                <h3 className="text-lg font-semibold">Avg RPE</h3>
                <p className="text-2xl font-bold text-orange-400">7.5</p>
              </div>
            </div>

            {/* Recent Workouts */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-orange-500/20">
              <h3 className="text-xl font-bold mb-4">Recent Workouts</h3>
              {workouts.length === 0 ? (
                <p className="text-gray-400">No workouts yet. Create your first workout!</p>
              ) : (
                <div className="space-y-4">
                  {workouts.slice(0, 5).map((workout) => (
                    <div key={workout.id} className="bg-black/20 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold capitalize">{workout.type} Day</h4>
                          <p className="text-gray-400">{new Date(workout.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">{workout.exercises.length} exercises</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'workout' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center">New Workout</h2>

            {/* Workout Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-orange-500/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Workout Type</label>
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white"
                  >
                    <option value="push">Push Day</option>
                    <option value="pull">Pull Day</option>
                    <option value="legs">Leg Day</option>
                    <option value="full">Full Body</option>
                    <option value="cardio">Cardio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                    className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Exercises */}
              <h3 className="text-xl font-bold mb-4">Exercises</h3>
              {exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="bg-black/20 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold">Exercise {exerciseIndex + 1}</h4>
                    {exercises.length > 1 && (
                      <button
                        onClick={() => removeExercise(exerciseIndex)}
                        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Exercise Name</label>
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                        placeholder="e.g., Bench Press"
                        className="w-full p-2 bg-black/20 border border-orange-500/30 rounded text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Equipment</label>
                      <select
                        value={exercise.equipment}
                        onChange={(e) => updateExercise(exerciseIndex, 'equipment', e.target.value)}
                        className="w-full p-2 bg-black/20 border border-orange-500/30 rounded text-white"
                      >
                        <option value="dumbbell">Dumbbell</option>
                        <option value="barbell">Barbell</option>
                        <option value="band">Band</option>
                        <option value="cable">Cable</option>
                        <option value="bodyweight">Body weight</option>
                        <option value="machine">Machine</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Warmup Sets</label>
                      <input
                        type="number"
                        value={exercise.warmupSets}
                        onChange={(e) => updateExercise(exerciseIndex, 'warmupSets', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full p-2 bg-black/20 border border-orange-500/30 rounded text-white"
                      />
                    </div>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    <h5 className="font-semibold">Working Sets</h5>
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-4 gap-2 items-center">
                        <div className="text-sm font-medium">Set {setIndex + 1}</div>
                        <input
                          type="number"
                          placeholder="Weight"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                          step="0.1"
                          min="0"
                          className="p-2 bg-black/20 border border-orange-500/30 rounded text-white text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                          min="1"
                          className="p-2 bg-black/20 border border-orange-500/30 rounded text-white text-sm"
                        />
                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder="RPE"
                            value={set.rpe || ''}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', parseInt(e.target.value) || 0)}
                            min="1"
                            max="10"
                            className="p-2 bg-black/20 border border-orange-500/30 rounded text-white text-sm flex-1"
                          />
                          {exercise.sets.length > 1 && (
                            <button
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              className="bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addSet(exerciseIndex)}
                      className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm"
                    >
                      + Add Set
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-4">
                <button
                  onClick={addExercise}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
                >
                  + Add Exercise
                </button>
                <button
                  onClick={saveWorkout}
                  className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg font-semibold"
                >
                  💾 Save Workout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
