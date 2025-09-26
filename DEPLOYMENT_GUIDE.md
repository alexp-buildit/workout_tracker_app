# 🚀 Workout Tracker Deployment Guide

## Overview
This guide will help you deploy your Workout Tracker app with:
- **Backend**: Node.js/Express API on Render with MongoDB Atlas
- **Frontend**: Next.js app on Vercel

---

## 📋 Prerequisites

1. **GitHub Account** (for code hosting)
2. **MongoDB Atlas Account** (free tier available)
3. **Render Account** (free tier available)
4. **Vercel Account** (free tier available)

---

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and log in
3. Create a new cluster (choose free tier M0)
4. Set cluster name: `workout-tracker`
5. Choose your preferred cloud provider and region

### 2. Create Database User
1. Go to Database Access → Add New Database User
2. Choose "Password" authentication
3. Username: `workout_app`
4. Generate a secure password (save it!)
5. Grant "Read and write to any database" permission

### 3. Configure Network Access
1. Go to Network Access → Add IP Address
2. Choose "Allow access from anywhere" (0.0.0.0/0) for now
3. Or add specific IPs later for better security

### 4. Get Connection String
1. Go to Database → Connect → Connect your application
2. Choose "Node.js" driver
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `workout_tracker`

Example: `mongodb+srv://workout_app:YOUR_PASSWORD@workout-tracker.xxxxx.mongodb.net/workout_tracker?retryWrites=true&w=majority`

---

## 🛠️ Backend Deployment (Render)

### 1. Push Backend Code to GitHub
```bash
cd workout_tracker_backend
git init
git add .
git commit -m "Initial backend setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/workout-tracker-backend.git
git push -u origin main
```

### 2. Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (`workout-tracker-backend`)
4. Configure the service:

**Basic Settings:**
- **Name**: `workout-tracker-api`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (or `workout_tracker_backend` if it's in a subdirectory)

**Build & Deploy Settings:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Advanced Settings:**
- **Plan**: Free (or choose paid plan for better performance)

### 3. Add Environment Variables
In your Render service dashboard, go to "Environment" and add:

```
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string_here
FRONTEND_URL=https://your-vercel-app-url.vercel.app
```

### 4. Deploy
- Click "Create Web Service"
- Wait for deployment to complete
- Your API will be available at: `https://workout-tracker-api.onrender.com`

---

## 🎨 Frontend Deployment (Vercel)

### 1. Update Environment Configuration
Create `workout_tracker_frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=https://workout-tracker-api.onrender.com/api
```

### 2. Push Frontend Code to GitHub
```bash
cd workout_tracker_frontend
git init
git add .
git commit -m "Initial frontend setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/workout-tracker-frontend.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository (`workout-tracker-frontend`)
4. Configure the project:

**Project Settings:**
- **Framework Preset**: Next.js
- **Root Directory**: `./` (or adjust if needed)
- **Build Command**: `npm run build`
- **Output Directory**: Leave default
- **Install Command**: `npm install`

**Environment Variables:**
Add in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://workout-tracker-api.onrender.com/api
```

### 4. Deploy
- Click "Deploy"
- Wait for deployment to complete
- Your app will be available at: `https://your-app-name.vercel.app`

---

## 🔄 Update Backend CORS

Once your Vercel app is deployed, update your Render environment variables:
```
FRONTEND_URL=https://your-vercel-app-url.vercel.app
```

---

## 🧪 Testing Your Deployment

### 1. Test API Endpoints
Visit these URLs to test your backend:
- Health check: `https://workout-tracker-api.onrender.com/api/health`
- API root: `https://workout-tracker-api.onrender.com/api`

### 2. Test Frontend
1. Visit your Vercel URL
2. Create a new account
3. Add a workout
4. Check that data persists

---

## 🔧 Troubleshooting

### Common Issues:

**1. CORS Errors**
- Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Check that both HTTP and HTTPS are handled correctly

**2. Database Connection Issues**
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check that connection string is correct in Render environment variables
- Ensure database user has proper permissions

**3. Build Failures**
- Check build logs in Render/Vercel dashboards
- Verify all dependencies are in package.json
- Make sure Node.js versions are compatible

**4. Environment Variables**
- Double-check all environment variables are set correctly
- Restart services after changing environment variables
- Use `NEXT_PUBLIC_` prefix for frontend environment variables

---

## 📈 Monitoring & Maintenance

### Render (Backend)
- Monitor API health at `/api/health`
- Check logs in Render dashboard
- Free tier has some limitations (spins down after inactivity)

### Vercel (Frontend)
- Monitor deployments in Vercel dashboard
- Check build logs for any issues
- Free tier includes good analytics

### MongoDB Atlas
- Monitor database usage in Atlas dashboard
- Set up alerts for high usage
- Free tier has 512MB storage limit

---

## 🚀 Production Optimizations

### Security:
1. **Environment Variables**: Never commit sensitive data
2. **IP Whitelist**: Restrict MongoDB Atlas to specific IPs in production
3. **Rate Limiting**: Already implemented in backend
4. **Input Validation**: Already implemented in backend

### Performance:
1. **Database Indexes**: Already implemented in models
2. **Caching**: Consider adding Redis for session management
3. **CDN**: Vercel includes CDN automatically
4. **Image Optimization**: Use Next.js Image component

### Monitoring:
1. **Error Tracking**: Consider adding Sentry
2. **Analytics**: Consider adding Google Analytics
3. **Uptime Monitoring**: Consider UptimeRobot for free monitoring

---

## 📞 Support

If you encounter issues:
1. Check the logs in Render/Vercel dashboards
2. Verify all environment variables are correct
3. Test API endpoints directly
4. Check MongoDB Atlas network access and user permissions

Your Workout Tracker is now ready for production! 🎉