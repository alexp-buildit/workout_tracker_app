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
  startTime: Date;
  endTime?: Date;
  duration?: number;
  exercises: Exercise[];
}

interface User {
  username: string;
}

// Complete Master Exercise List from PRD
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://workout-tracker-backend-f150.onrender.com/api';

const MASTER_EXERCISE_LIST = [
  'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Press', 'Incline Dumbbell Press',
  'Dumbbell Flyes', 'Cable Flyes', 'Push-ups', 'Dips', 'Overhead Press', 'Arnold Press', 'Lateral Raises',
  'Front Raises', 'Rear Delt Flyes', 'Tricep Pushdowns', 'Overhead Tricep Extension', 'Close-Grip Bench Press',
  'Diamond Push-ups', 'Tricep Dips', 'Cable Lateral Raises', 'Machine Chest Press', 'Pull-ups', 'Chin-ups',
  'Lat Pulldowns', 'Cable Rows', 'Barbell Rows', 'Dumbbell Rows', 'T-Bar Rows', 'Face Pulls', 'Shrugs',
  'Bicep Curls', 'Hammer Curls', 'Preacher Curls', 'Cable Curls', 'Concentration Curls', 'Deadlifts',
  'Romanian Deadlifts', 'Good Mornings', 'Hyperextensions', 'Squats', 'Front Squats', 'Leg Press', 'Hack Squats',
  'Lunges', 'Bulgarian Split Squats', 'Leg Extensions', 'Leg Curls', 'Calf Raises', 'Goblet Squats', 'Step-ups',
  'Box Jumps', 'Glute Bridges', 'Hip Thrusts', 'Walking Lunges', 'Sumo Deadlifts', 'Stiff Leg Deadlifts',
  'Plank', 'Side Plank', 'Crunches', 'Russian Twists', 'Leg Raises', 'Mountain Climbers', 'Burpees',
  'Farmers Walk', 'Turkish Get-ups', 'Ab Wheel Rollouts', 'Cable Crunches', 'Hanging Leg Raises', 'Dead Bugs',
  'Bird Dogs', 'Pallof Press', 'Clean & Press', 'Push Press', 'Snatch', 'Power Clean', 'Hang Clean',
  'Thruster (Squat + Press)', 'Z Press', 'Jefferson Deadlift', 'Barbell Hip Thrust', 'Barbell Rollouts',
  'Barbell Shrug Behind-the-Back', 'Dumbbell Pullover', 'Renegade Rows', 'Zottman Curls', 'Dumbbell Deadlift',
  'Dumbbell Thrusters', 'Dumbbell Step-through Lunges', 'Dumbbell Snatch (Single-arm)', 'Dumbbell Clean & Press',
  'Suitcase Deadlift', 'Kettlebell Swing', 'Kettlebell Clean', 'Kettlebell Snatch', 'Kettlebell Goblet Clean',
  'Kettlebell Deadlift High Pull', 'Kettlebell Halo', 'Kettlebell Windmill', 'Muscle-ups', 'Archer Push-ups',
  'Planche Progressions', 'Handstand Push-ups', 'Handstand Holds/Wall Walks', 'Front Lever', 'Back Lever',
  'Dragon Flags', 'L-sits', 'Pistol Squats', 'Shrimp Squats', 'Nordic Hamstring Curls', 'Inverted Rows',
  'Skin-the-Cat (Rings/Bar)', 'Clap Push-ups', 'Depth Jumps', 'Broad Jumps', 'Sprinting Drills', 'Bounding',
  'Medicine Ball Slams', 'Medicine Ball Chest Pass', 'Medicine Ball Rotational Throws', 'Lateral Skater Jumps',
  'Hollow Body Hold', 'V-Ups', 'Toe-to-Bar', 'Hanging Windshield Wipers', 'Weighted Sit-ups',
  'Side Bends (Dumbbell/Barbell/Plate)', 'Stir-the-Pot (on Stability Ball)', 'Stability Ball Pike', 'Suitcase Carry',
  'Overhead Carry', 'Jefferson Squat', 'Sissy Squat', 'Curtsy Lunge', 'Cossack Squat', 'Kang Squat (Good Morning + Squat)',
  'Reverse Nordics', 'Belt Squat', 'Smith Machine Squat Variations', 'Atlas Stone Lifts', 'Log Press', 'Yoke Carry',
  'Sled Push', 'Sled Pull', 'Sandbag Carry', 'Tire Flip', 'Overhead Sandbag Toss', 'Axle Deadlift',
  'Shoulder Dislocates (Band or PVC)', 'Banded Pull-aparts', 'Cuban Rotations', 'Cat-Cow Stretch',
  'World\'s Greatest Stretch', 'Hip Airplanes', '90/90 Hip Rotations', 'Barbell Complex (e.g., Clean + Front Squat + Press)',
  'Dumbbell Farmer\'s Carry', 'Single-Leg Romanian Deadlift', 'Reverse Hyperextensions', 'Seated Good Mornings',
  'Zercher Squat', 'Anderson Squat', 'Pause Squat', 'Tempo Squat', 'Overhead Squat', 'Barbell Bench Pull',
  'Dumbbell Bench Pull', 'Cable Woodchoppers (High-to-Low, Low-to-High)', 'Cable Face Pull with External Rotation',
  'Cable Tricep Kickbacks', 'Cable Bicep 21s', 'Single-Arm Cable Rows', 'Incline Push-ups', 'Decline Push-ups',
  'Pike Push-ups', 'Hindu Push-ups', 'Superman Hold', 'Scapular Push-ups', 'Wall Angels', 'Prone Y-T-I Raises',
  'Reverse Flyes (Band or Dumbbell)', 'Single-Leg Glute Bridge', 'Donkey Kicks', 'Fire Hydrants', 'Clamshells',
  'Single-Leg Calf Raises', 'Seated Calf Raises', 'Jump Squats', 'Tuck Jumps', 'Star Jumps', 'Single-Leg Box Jumps',
  'Lateral Box Jumps', 'Battle Rope Alternating Waves', 'Battle Rope Double Slams', 'Battle Rope Jumping Jacks',
  'Sled Sprint', 'Weighted Vest Push-ups', 'Weighted Vest Pull-ups', 'Weighted Vest Squats', 'Isometric Squat Hold',
  'Isometric Push-up Hold', 'Isometric Plank Variations (e.g., High Plank, Low Plank)', 'Spiderman Plank',
  'Copenhagen Plank', 'Reverse Plank', 'Bicycle Crunches', 'Flutter Kicks', 'Scissor Kicks', 'Jackknife Sit-ups'
];

export default function WorkoutTracker() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // App state
  const [currentView, setCurrentView] = useState('workout');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Workout state
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [workoutType, setWorkoutType] = useState('Push');
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<Exercise[]>([{
    name: '',
    equipment: 'Dumbbell',
    warmupSets: 0,
    sets: [{ weight: 0, reps: 0, rpe: 0 }]
  }]);

  // Auto-save and search state
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const [workoutTimer, setWorkoutTimer] = useState(0);

  // Load data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('workoutTrackerUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsLoggedIn(true);
      loadWorkouts(user.username);
    }
  }, []);

  // Workout timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeWorkout && !activeWorkout.endTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeWorkout.startTime.getTime()) / 1000);
        setWorkoutTimer(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!activeWorkout || !currentUser) return;

    const autoSaveInterval = setInterval(() => {
      autoSaveWorkout();
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [activeWorkout, exercises, currentUser]);

  const signin = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setIsAuthLoading(true);

    try {
      await axios.get(`${API_URL}/users/${username.trim()}`);
      const user = { username: username.trim() };
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('workoutTrackerUser', JSON.stringify(user));
      toast.success(`Welcome back, ${username}!`);
      await loadWorkouts(username);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response?.status === 404) {
        toast.error('Account not found. Please register first.');
      } else if (axiosError.response?.status === 400) {
        toast.error((axiosError.response.data as { message?: string })?.message || 'Invalid username format');
      } else {
        console.error('Login error:', error);
        toast.error('Connection error. Please try again.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const register = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsAuthLoading(true);

    try {
      await axios.post(`${API_URL}/users`, {
        username: username.trim(),
        phone: phoneNumber.trim()
      });
      const user = { username: username.trim() };
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('workoutTrackerUser', JSON.stringify(user));
      toast.success(`Welcome, ${username}! Account created.`);
      await loadWorkouts(username);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response?.status === 400) {
        const message = (axiosError.response.data as { message?: string })?.message || 'Username already exists or invalid data';
        toast.error(message);
      } else {
        console.error('Registration error:', error);
        toast.error('Connection error. Please try again.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveWorkout(null);
    localStorage.removeItem('workoutTrackerUser');
    setWorkouts([]);
    toast.success('Logged out successfully');
  };

  const loadWorkouts = async (username: string) => {
    try {
      const response = await axios.get(`${API_URL}/workouts/${username}`);
      const workoutsData = response.data.workouts || [];
      const parsed = workoutsData.map((w: unknown) => {
        const workout = w as Record<string, unknown>;
        return {
          ...workout,
          startTime: new Date(workout.startTime as string),
          endTime: workout.endTime ? new Date(workout.endTime as string) : undefined
        };
      });
      setWorkouts(parsed);
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } })?.response?.status !== 404) {
        console.error('Load workouts error:', error);
        toast.error('Failed to load workouts');
      }
      setWorkouts([]);
    }
  };

  const saveWorkout = async (workout: Workout) => {
    if (!currentUser) return;

    try {
      await axios.post(`${API_URL}/workouts`, {
        username: currentUser.username,
        type: workout.type,
        date: workout.date,
        startTime: workout.startTime,
        endTime: workout.endTime,
        duration: workout.duration,
        exercises: workout.exercises
      });

      // Update local state
      const updatedWorkouts = workouts.filter(w => w.id !== workout.id);
      setWorkouts([...updatedWorkouts, workout]);
    } catch (error) {
      console.error('Save workout error:', error);
      throw error;
    }
  };

  const autoSaveWorkout = async () => {
    if (!activeWorkout || !currentUser || isAutoSaving) return;

    setIsAutoSaving(true);
    try {
      const filteredExercises = exercises.filter(ex => ex.name.trim() !== '');
      if (filteredExercises.length > 0) {
        const updatedWorkout = {
          ...activeWorkout,
          exercises: filteredExercises
        };

        await saveWorkout(updatedWorkout);
        setActiveWorkout(updatedWorkout);

        toast.success('💾 Auto-saved!', { duration: 1500 });
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Auto-save failed');
    } finally {
      setIsAutoSaving(false);
    }
  };

  const startWorkout = () => {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      type: workoutType,
      date: workoutDate,
      startTime: new Date(),
      exercises: []
    };

    setActiveWorkout(newWorkout);
    setExercises([{
      name: '',
      equipment: 'Dumbbell',
      warmupSets: 0,
      sets: [{ weight: 0, reps: 0, rpe: 0 }]
    }]);
    setWorkoutTimer(0);
    toast.success('Workout started!');
  };

  const finishWorkout = async () => {
    if (!activeWorkout || !currentUser) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - activeWorkout.startTime.getTime()) / 60000); // minutes

    const completedWorkout = {
      ...activeWorkout,
      endTime,
      duration,
      exercises: exercises.filter(ex => ex.name.trim() !== '')
    };

    try {
      await saveWorkout(completedWorkout);
      setActiveWorkout(null);
      setWorkoutTimer(0);
      toast.success(`Workout completed! Duration: ${duration} minutes`);
    } catch {
      toast.error('Failed to save workout');
    }
  };


  // Exercise functions
  const addExercise = () => {
    setExercises([...exercises, {
      name: '',
      equipment: 'Dumbbell',
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
    return MASTER_EXERCISE_LIST.filter(exercise =>
      exercise.toLowerCase().includes(exerciseSearch.toLowerCase())
    ).slice(0, 10);
  };

  // Calendar and analytics functions
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayWorkouts = workouts.filter(w =>
        new Date(w.date).toDateString() === current.toDateString()
      );

      days.push({
        date: new Date(current),
        workouts: dayWorkouts,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString()
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getMonthlyStats = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate >= monthStart && workoutDate <= monthEnd;
    });

    const totalWorkouts = monthWorkouts.length;
    const avgDuration = monthWorkouts.length > 0
      ? Math.round(monthWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / monthWorkouts.length)
      : 0;

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

    const avgRPE = rpeCount > 0 ? Math.round((totalRPE / rpeCount) * 10) / 10 : 0;
    const uniqueDates = [...new Set(monthWorkouts.map(w => w.date))];
    const weeksInMonth = Math.ceil(monthEnd.getDate() / 7);
    const daysPerWeek = Math.round((uniqueDates.length / weeksInMonth) * 10) / 10;

    return { totalWorkouts, avgDuration, avgRPE, daysPerWeek };
  };


  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const deleteWorkout = async (workoutId: string) => {
    if (!currentUser) return;

    try {
      // For now, we'll delete locally and not implement backend delete endpoint
      const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
      setWorkouts(updatedWorkouts);
      toast.success('Workout deleted');
    } catch {
      toast.error('Failed to delete workout');
    }
  };

  const editWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setExercises(workout.exercises);
    setWorkoutType(workout.type);
    setWorkoutDate(workout.date);
    setCurrentView('workout');
  };

  // Authentication screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center px-4">
        <Toaster position="top-right" />
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 md:p-8 border border-orange-500/20 w-full max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-orange-400">💪 Workout Tracker</h1>

          {authMode === 'signin' ? (
            // Sign In Form
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Sign In</h2>
                <p className="text-gray-300 text-sm">Welcome back! Enter your username to continue.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isAuthLoading && signin()}
                  disabled={isAuthLoading}
                  className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white placeholder-gray-400 text-base"
                />
              </div>

              <button
                onClick={signin}
                disabled={isAuthLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-colors text-base flex items-center justify-center gap-2"
              >
                {isAuthLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {isAuthLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="text-center mt-4">
                <p className="text-gray-400 text-sm">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setUsername('');
                      setPhoneNumber('');
                    }}
                    className="text-orange-400 hover:text-orange-300 font-medium"
                  >
                    Create one here
                  </button>
                </p>
              </div>
            </div>
          ) : (
            // Register Form
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold mb-2">Create Account</h2>
                <p className="text-gray-300 text-sm">Join today! Choose a username and add your phone number.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isAuthLoading}
                  className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white placeholder-gray-400 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isAuthLoading && register()}
                  disabled={isAuthLoading}
                  className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white placeholder-gray-400 text-base"
                />
              </div>

              <button
                onClick={register}
                disabled={isAuthLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-colors text-base flex items-center justify-center gap-2"
              >
                {isAuthLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {isAuthLoading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="text-center mt-4">
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setUsername('');
                      setPhoneNumber('');
                    }}
                    className="text-orange-400 hover:text-orange-300 font-medium"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-orange-400">💪 Workout Tracker</h1>
            {activeWorkout && (
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Live: {formatTime(workoutTimer)}</span>
              </div>
            )}
            {isAutoSaving && (
              <div className="flex items-center gap-2 text-orange-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400"></div>
                <span className="text-sm">Auto-saving...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {currentUser?.username}</span>
            <nav className="flex flex-wrap gap-2 md:gap-4">
              <button
                onClick={() => setCurrentView('workout')}
                className={`px-2 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${currentView === 'workout' ? 'bg-orange-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
              >
                🏋️ Workout
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-2 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${currentView === 'dashboard' ? 'bg-orange-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-2 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${currentView === 'history' ? 'bg-orange-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
              >
                📋 History
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-2 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${currentView === 'analytics' ? 'bg-orange-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}
              >
                📈 Analytics
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
        {/* Workout View */}
        {currentView === 'workout' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Workout</h2>
              {activeWorkout ? (
                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">
                      💾 Your workout auto-saves every 30 seconds
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Auto-save enabled
                    </div>
                  </div>
                  <button
                    onClick={finishWorkout}
                    className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    ✅ Finish Workout
                  </button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <select
                    value={workoutType}
                    onChange={(e) => setWorkoutType(e.target.value)}
                    className="p-2 bg-black/20 border border-orange-500/30 rounded-lg text-white"
                  >
                    <option value="Push">Push</option>
                    <option value="Pull">Pull</option>
                    <option value="Legs">Legs</option>
                    <option value="Upper Body">Upper Body</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="date"
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                    className="p-2 bg-black/20 border border-orange-500/30 rounded-lg text-white"
                  />
                  <button
                    onClick={startWorkout}
                    className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg font-semibold"
                  >
                    🚀 Start Workout
                  </button>
                </div>
              )}
            </div>

            {activeWorkout && (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-orange-500/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{activeWorkout.type} Workout</h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Started: {activeWorkout.startTime.toLocaleTimeString()}</p>
                    <p className="text-lg font-bold text-orange-400">{formatTime(workoutTimer)}</p>
                  </div>
                </div>

                {/* Exercises */}
                <h4 className="text-lg font-bold mb-4">Exercises</h4>
                {exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="bg-black/20 rounded-lg p-4 mb-4 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-lg font-semibold">Exercise {exerciseIndex + 1}</h5>
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
                          placeholder="Search exercises..."
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
                          <option value="Dumbbell">Dumbbell</option>
                          <option value="Barbell">Barbell</option>
                          <option value="Band">Band</option>
                          <option value="Cable">Cable</option>
                          <option value="Body weight">Body weight</option>
                          <option value="Machine">Machine</option>
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
                      <h6 className="font-semibold">Working Sets</h6>
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

                <button
                  onClick={addExercise}
                  className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg"
                >
                  + Add Exercise
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dashboard View */}
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
              <div className="text-center">
                <h2 className="text-2xl font-bold">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={goToToday}
                  className="text-sm text-orange-400 hover:text-orange-300"
                >
                  Today
                </button>
              </div>
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

            {/* Calendar */}
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-orange-500/20">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center font-bold text-orange-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((day, index) => (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-2 border rounded cursor-pointer transition-colors
                      ${day.isCurrentMonth ? 'bg-black/20 border-orange-500/20' : 'bg-black/10 border-gray-600'}
                      ${day.isToday ? 'ring-2 ring-orange-400' : ''}
                      hover:bg-orange-500/10
                    `}
                  >
                    <div className={`text-sm ${day.isCurrentMonth ? 'text-white' : 'text-gray-500'}`}>
                      {day.date.getDate()}
                    </div>
                    {day.workouts.map((workout, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedWorkout(workout);
                          setCurrentView('workoutDetail');
                        }}
                        className={`
                          text-xs px-1 py-0.5 rounded mt-1 truncate w-full text-left hover:brightness-110 transition-all
                          ${workout.type === 'Push' ? 'bg-red-500/70 hover:bg-red-500/90' : ''}
                          ${workout.type === 'Pull' ? 'bg-blue-500/70 hover:bg-blue-500/90' : ''}
                          ${workout.type === 'Legs' ? 'bg-green-500/70 hover:bg-green-500/90' : ''}
                          ${workout.type === 'Upper Body' ? 'bg-purple-500/70 hover:bg-purple-500/90' : ''}
                          ${workout.type === 'Other' ? 'bg-orange-500/70 hover:bg-orange-500/90' : ''}
                        `}
                        title={`Click to view details • ${workout.type} - ${workout.exercises.length} exercises`}
                      >
                        {workout.type}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">Workout History</h2>

            {workouts.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-orange-500/20 text-center">
                <p className="text-gray-400 text-lg">No workouts recorded yet.</p>
                <p className="text-gray-500 mt-2">Start your first workout to see it here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((workout) => (
                    <div
                      key={workout.id}
                      className="bg-white/10 backdrop-blur-lg rounded-lg p-4 md:p-6 border border-orange-500/20"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg md:text-xl font-semibold">{workout.type} Workout</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              workout.type === 'Push' ? 'bg-red-500/70' :
                              workout.type === 'Pull' ? 'bg-blue-500/70' :
                              workout.type === 'Legs' ? 'bg-green-500/70' :
                              workout.type === 'Upper Body' ? 'bg-purple-500/70' :
                              'bg-orange-500/70'
                            }`}>
                              {workout.type}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm md:text-base">
                            {new Date(workout.date).toLocaleDateString()}
                            {workout.duration && ` • ${workout.duration} minutes`}
                            {` • ${workout.exercises.length} exercises`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {workout.exercises.slice(0, 3).map((exercise, idx) => (
                              <span key={idx} className="bg-black/20 px-2 py-1 rounded text-xs text-gray-300">
                                {exercise.name}
                              </span>
                            ))}
                            {workout.exercises.length > 3 && (
                              <span className="bg-black/20 px-2 py-1 rounded text-xs text-gray-400">
                                +{workout.exercises.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedWorkout(workout);
                              setCurrentView('workoutDetail');
                            }}
                            className="bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded text-sm transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => editWorkout(workout)}
                            className="bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this workout?')) {
                                deleteWorkout(workout.id);
                              }
                            }}
                            className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Workout Detail View */}
        {currentView === 'workoutDetail' && selectedWorkout && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('history')}
                className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
              >
                ← Back to History
              </button>
              <h2 className="text-2xl md:text-3xl font-bold">{selectedWorkout.type} Workout Details</h2>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 md:p-6 border border-orange-500/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold text-orange-400">Date</h4>
                  <p>{new Date(selectedWorkout.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-400">Duration</h4>
                  <p>{selectedWorkout.duration ? `${selectedWorkout.duration} minutes` : 'Not recorded'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-orange-400">Exercises</h4>
                  <p>{selectedWorkout.exercises.length} exercises</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-orange-400">Exercise Details</h4>
                {selectedWorkout.exercises.map((exercise, idx) => (
                  <div key={idx} className="bg-black/20 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                      <h5 className="font-semibold">{exercise.name}</h5>
                      <span className="text-sm text-gray-400">{exercise.equipment}</span>
                    </div>
                    {exercise.warmupSets > 0 && (
                      <p className="text-sm text-gray-400 mb-2">Warmup Sets: {exercise.warmupSets}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {exercise.sets.map((set, setIdx) => (
                        <div key={setIdx} className="bg-white/5 rounded p-2 text-sm">
                          <span className="font-medium">Set {setIdx + 1}:</span> {set.weight}lbs × {set.reps} reps
                          {set.rpe && <span className="text-orange-400"> (RPE: {set.rpe})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">Analytics</h2>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 md:p-6 border border-orange-500/20">
              <h3 className="text-xl font-bold mb-4">Exercise Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">Exercise Name</label>
                  <input
                    type="text"
                    placeholder="Search exercise..."
                    value={exerciseSearch}
                    onChange={(e) => {
                      setExerciseSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white text-base"
                  />
                  {showSuggestions && exerciseSearch && (
                    <div className="absolute z-10 w-full bg-black/90 border border-orange-500/30 rounded-lg mt-1 max-h-48 overflow-y-auto">
                      {MASTER_EXERCISE_LIST
                        .filter(exercise =>
                          exercise.toLowerCase().includes(exerciseSearch.toLowerCase())
                        )
                        .slice(0, 10)
                        .map(exercise => (
                          <button
                            key={exercise}
                            onClick={() => {
                              setExerciseSearch(exercise);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-orange-500/20 transition-colors"
                          >
                            {exercise}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Equipment (optional)</label>
                  <select className="w-full p-3 bg-black/20 border border-orange-500/30 rounded-lg text-white text-base">
                    <option value="">All Equipment</option>
                    <option value="Dumbbell">Dumbbell</option>
                    <option value="Barbell">Barbell</option>
                    <option value="Band">Band</option>
                    <option value="Cable">Cable</option>
                    <option value="Body weight">Body weight</option>
                    <option value="Machine">Machine</option>
                  </select>
                </div>
              </div>

              <p className="text-gray-400">Select an exercise to view detailed analytics including max weight, total volume, times performed, and RPE trends.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}