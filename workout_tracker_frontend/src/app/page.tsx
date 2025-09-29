'use client';

import { useState, useEffect, useCallback } from 'react';
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

interface User {
  username: string;
  phone: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Popular exercises for search suggestions
const POPULAR_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Pull-ups', 'Push-ups', 'Overhead Press',
  'Barbell Row', 'Dumbbell Row', 'Lat Pulldown', 'Leg Press', 'Lunges', 'Bicep Curls',
  'Tricep Dips', 'Shoulder Press', 'Chest Fly', 'Leg Curls', 'Calf Raises', 'Plank',
  'Russian Twists', 'Mountain Climbers', 'Burpees', 'Jumping Jacks', 'Hip Thrusts',
  'Romanian Deadlift', 'Front Squat', 'Incline Press', 'Decline Press', 'Face Pulls'
];

export default function WorkoutTracker() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', phone: '' });
  const [signupForm, setSignupForm] = useState({ username: '', phone: '' });

  // App state
  const [currentView, setCurrentView] = useState('workout'); // Start with workout tab
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Workout form state
  const [workoutType, setWorkoutType] = useState('upper');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<Exercise[]>([{
    name: '',
    equipment: 'dumbbell',
    warmupSets: 0,
    sets: [{ weight: 0, reps: 0, rpe: 0 }]
  }]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Exercise search state
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);

  // Check for saved user on load
  useEffect(() => {
    const savedUser = localStorage.getItem('workoutTrackerUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      loadWorkouts(user.username);
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;

    const autoSaveTimer = setTimeout(() => {
      if (exercises.some(ex => ex.name.trim() || ex.sets.some(set => set.weight > 0 || set.reps > 0))) {
        autoSaveWorkout();
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [exercises, workoutType, workoutDate, isLoggedIn, currentUser]);

  const autoSaveWorkout = async () => {
    if (!currentUser || isAutoSaving) return;

    setIsAutoSaving(true);
    try {
      const workout = {
        username: currentUser.username,
        type: workoutType,
        date: workoutDate,
        startTime: new Date().toISOString(),
        exercises: exercises.filter(ex => ex.name.trim() !== '')
      };

      if (workout.exercises.length > 0) {
        await axios.post(`${API_URL}/workouts`, workout);
        toast.success('💾 Auto-saved!', { duration: 1500 });
        loadWorkouts(currentUser.username);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const login = async () => {
    try {
      if (!loginForm.username.trim() || !loginForm.phone.trim()) {
        toast.error('Please enter username and phone number');
        return;
      }

      // Try to find existing user
      const response = await axios.get(`${API_URL}/users/${loginForm.username}`);
      const user = response.data;

      if (user.phone === loginForm.phone) {
        setCurrentUser({ username: user.username, phone: user.phone });
        setIsLoggedIn(true);
        localStorage.setItem('workoutTrackerUser', JSON.stringify({ username: user.username, phone: user.phone }));
        toast.success(`Welcome back, ${user.username}!`);
        loadWorkouts(user.username);
      } else {
        toast.error('Invalid phone number for this username');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error('User not found. Please sign up first.');
      } else {
        toast.error('Login failed');
      }
    }
  };

  const signup = async () => {
    try {
      if (!signupForm.username.trim() || !signupForm.phone.trim()) {
        toast.error('Please enter username and phone number');
        return;
      }

      await axios.post(`${API_URL}/users`, {
        username: signupForm.username,
        email: `${signupForm.username}@example.com`,
        password: 'temp123',
        phone: signupForm.phone
      });

      const user = { username: signupForm.username, phone: signupForm.phone };
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('workoutTrackerUser', JSON.stringify(user));
      toast.success(`Account created! Welcome, ${signupForm.username}!`);
      loadWorkouts(signupForm.username);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        toast.error('Username already exists');
      } else {
        toast.error('Signup failed');
      }
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('workoutTrackerUser');
    setWorkouts([]);
    toast.success('Logged out successfully');
  };

  const loadWorkouts = useCallback(async (username: string) => {
    try {
      const response = await axios.get(`${API_URL}/workouts/${username}`);
      setWorkouts(response.data.workouts || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  }, []);

  const saveWorkout = async () => {
    if (!currentUser) return;

    try {
      const workout = {
        username: currentUser.username,
        type: workoutType,
        date: workoutDate,
        startTime: new Date().toISOString(),
        exercises: exercises.filter(ex => ex.name.trim() !== '')
      };

      await axios.post(`${API_URL}/workouts`, workout);
      toast.success('Workout saved successfully!');
      loadWorkouts(currentUser.username);

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
    (newExercises[index] as unknown as Record<string, unknown>)[field] = value;
    setExercises(newExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof Set, value: number) => {
    const newExercises = [...exercises];
    (newExercises[exerciseIndex].sets[setIndex] as unknown as Record<string, unknown>)[field] = value;
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

  const handleExerciseSearch = (value: string, exerciseIndex: number) => {
    setExerciseSearch(value);
    setActiveExerciseIndex(exerciseIndex);
    setShowSuggestions(value.length > 0);
    updateExercise(exerciseIndex, 'name', value);
  };

  const selectExercise = (exerciseName: string) => {
    if (activeExerciseIndex !== null) {
      updateExercise(activeExerciseIndex, 'name', exerciseName);
    }
    setShowSuggestions(false);
    setExerciseSearch('');
    setActiveExerciseIndex(null);
  };

  const getFilteredExercises = () => {
    return POPULAR_EXERCISES.filter(exercise =>
      exercise.toLowerCase().includes(exerciseSearch.toLowerCase())
    );
  };

  const getMonthlyStats = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= monthStart && workoutDate <= monthEnd;
    });

    const stats = {
      totalWorkouts: monthWorkouts.length,
      avgDuration: 60, // Default value
      avgRPE: 0,
      daysPerWeek: 0
    };

    if (monthWorkouts.length > 0) {
      let totalRPE = 0;
      let rpeCount = 0;

      monthWorkouts.forEach(workout => {
        workout.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            if (set.rpe && set.rpe > 0) {
              totalRPE += set.rpe;
              rpeCount++;
            }
          });
        });
      });

      stats.avgRPE = rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : 0;

      const uniqueDates = [...new Set(monthWorkouts.map(w => w.date))];
      const weeksInMonth = Math.ceil(monthEnd.getDate() / 7);
      stats.daysPerWeek = Math.round((uniqueDates.length / weeksInMonth) * 10) / 10;
    }

    return stats;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Authentication screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-orange-500/20 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-orange-400">💪 Workout Tracker</h1>

          <div className="flex mb-6">
            <button
              onClick={() => setShowLogin(true)}
              className={`flex-1 py-2 px-4 rounded-l-lg ${showLogin ? 'bg-orange-500 text-white' : 'bg-white/10'}`}
            >
              Login
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className={`flex-1 py-2 px-4 rounded-r-lg ${!showLogin ? 'bg-orange-500 text-white' : 'bg-white/10'}`}
            >
              Sign Up
            </button>
          </div>

          {showLogin ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white placeholder-gray-400"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={loginForm.phone}
                onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white placeholder-gray-400"
              />
              <button
                onClick={login}
                className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-lg font-semibold transition-colors"
              >
                Login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={signupForm.username}
                onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white placeholder-gray-400"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={signupForm.phone}
                onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white placeholder-gray-400"
              />
              <button
                onClick={signup}
                className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-orange-500/20 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-400">💪 Workout Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {currentUser?.username}</span>
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
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            {/* Monthly Navigation */}
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
              <button
                onClick={previousMonth}
                className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg"
              >
                ← Previous
              </button>
              <h2 className="text-2xl font-bold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={nextMonth}
                className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg"
              >
                Next →
              </button>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(() => {
                const stats = getMonthlyStats();
                return (
                  <>
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
                      <h3 className="text-lg font-semibold">Total Workouts</h3>
                      <p className="text-2xl font-bold text-orange-400">{stats.totalWorkouts}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
                      <h3 className="text-lg font-semibold">Avg Duration</h3>
                      <p className="text-2xl font-bold text-orange-400">{stats.avgDuration}m</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
                      <h3 className="text-lg font-semibold">Avg RPE</h3>
                      <p className="text-2xl font-bold text-orange-400">{stats.avgRPE}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-orange-500/20">
                      <h3 className="text-lg font-semibold">Days/Week</h3>
                      <p className="text-2xl font-bold text-orange-400">{stats.daysPerWeek}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Monthly Workouts */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-orange-500/20">
              <h3 className="text-xl font-bold mb-4">This Month's Workouts</h3>
              {(() => {
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                const monthWorkouts = workouts.filter(w => {
                  const workoutDate = new Date(w.date);
                  return workoutDate >= monthStart && workoutDate <= monthEnd;
                });

                return monthWorkouts.length === 0 ? (
                  <p className="text-gray-400">No workouts this month. Start your first workout!</p>
                ) : (
                  <div className="space-y-4">
                    {monthWorkouts.map((workout) => (
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
                );
              })()}
            </div>
          </div>
        )}

        {currentView === 'workout' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">New Workout</h2>
              {isAutoSaving && (
                <div className="flex items-center gap-2 text-orange-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400"></div>
                  <span className="text-sm">Auto-saving...</span>
                </div>
              )}
            </div>

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
                    <option value="upper">Upper Body</option>
                    <option value="lower">Lower Body</option>
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
                <div key={exerciseIndex} className="bg-black/20 rounded-lg p-4 mb-4 relative">
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
                    <div className="relative">
                      <label className="block text-sm font-medium mb-2">Exercise Name</label>
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => handleExerciseSearch(e.target.value, exerciseIndex)}
                        placeholder="e.g., Bench Press"
                        className="w-full p-2 bg-black/20 border border-orange-500/30 rounded text-white"
                      />

                      {/* Exercise Suggestions */}
                      {showSuggestions && activeExerciseIndex === exerciseIndex && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-black/90 border border-orange-500/30 rounded-lg mt-1 max-h-48 overflow-y-auto">
                          {getFilteredExercises().map((exerciseName, index) => (
                            <button
                              key={index}
                              onClick={() => selectExercise(exerciseName)}
                              className="w-full text-left p-2 hover:bg-orange-500/20 text-white"
                            >
                              {exerciseName}
                            </button>
                          ))}
                        </div>
                      )}
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