# 🚀 Workout Tracker Deployment Guide

## Overview
This guide will help you deploy your Workout Tracker app with:
- **Backend**: Node.js/Express API on Render with PostgreSQL database
- **Frontend**: Next.js app on Netlify

---

## 📋 Prerequisites

1. **GitHub Account** (for code hosting)
2. **Render Account** (free tier available with PostgreSQL)
3. **Netlify Account** (free tier available)

---

## 🗄️ Database Setup (Render PostgreSQL)

Render provides a free PostgreSQL database that integrates seamlessly with your web service. The database will be automatically configured when you deploy using the `render.yaml` file.

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

### 2. Deploy on Render using render.yaml
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository (`workout-tracker-backend`)
4. Render will automatically read the `render.yaml` file and:
   - Create a PostgreSQL database named `workout-tracker-db`
   - Create a web service named `workout-tracker-api`
   - Configure environment variables automatically

**The render.yaml file includes:**
- **Database**: Free PostgreSQL instance
- **Web Service**: Node.js application
- **Auto-configured Environment Variables**:
  - `DATABASE_URL`: Automatically linked to PostgreSQL
  - `NODE_ENV`: Set to production
  - `FRONTEND_URL`: Update this with your Netlify URL later

### 3. Update Frontend URL
After your Netlify site is deployed, update the `FRONTEND_URL` in your Render service:
1. Go to your service dashboard
2. Navigate to "Environment"
3. Update `FRONTEND_URL` to your Netlify URL

### 4. Deploy
- Click "Apply"
- Wait for deployment to complete
- Your API will be available at: `https://workout-tracker-api.onrender.com`
- Database will be automatically created and connected

---

## 🎨 Frontend Deployment (Netlify)

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

### 3. Deploy on Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your repository (`workout-tracker-frontend`)
5. Configure the build settings:

**Build Settings:**
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Functions Directory**: Leave empty

**Environment Variables:**
In Site Settings → Environment Variables, add:
```
NEXT_PUBLIC_API_URL=https://workout-tracker-api.onrender.com/api
```

### 4. Configure netlify.toml
The `netlify.toml` file in your frontend handles:
- Build configuration
- Redirects for API calls
- Security headers
- SPA fallback routing

### 5. Deploy
- Click "Deploy site"
- Wait for deployment to complete
- Your app will be available at: `https://amazing-name-123456.netlify.app`
- You can customize the domain name in Site Settings

---

## 🔄 Update Backend CORS

Once your Netlify app is deployed, update your Render environment variables:
1. Go to your Render service dashboard
2. Navigate to "Environment"
3. Update `FRONTEND_URL` to your Netlify URL:
```
FRONTEND_URL=https://your-app-name.netlify.app
```

---

## 🧪 Testing Your Deployment

### 1. Test API Endpoints
Visit these URLs to test your backend:
- Health check: `https://workout-tracker-api.onrender.com/api/health`
- API root: `https://workout-tracker-api.onrender.com/api`

### 2. Test Frontend
1. Visit your Netlify URL
2. Create a new account
3. Add a workout
4. Check that data persists

---

## 🔧 Troubleshooting

### Common Issues:

**1. CORS Errors**
- Make sure `FRONTEND_URL` in Render matches your Netlify URL exactly
- Check that both HTTP and HTTPS are handled correctly

**2. Database Connection Issues**
- Check Render logs for PostgreSQL connection errors
- Ensure `DATABASE_URL` environment variable is properly set (auto-configured via render.yaml)
- Verify database service is running in Render dashboard

**3. Build Failures**
- Check build logs in Render/Netlify dashboards
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

### Netlify (Frontend)
- Monitor deployments in Netlify dashboard
- Check build logs and function logs for any issues
- Free tier includes analytics and form handling

### Render PostgreSQL
- Monitor database usage in Render dashboard
- Check database logs for connection issues
- Free tier has 1GB storage limit
- Database automatically backs up and restores

---

## 🚀 Production Optimizations

### Security:
1. **Environment Variables**: Never commit sensitive data
2. **Database Security**: Render PostgreSQL includes built-in security features
3. **Rate Limiting**: Already implemented in backend
4. **Input Validation**: Already implemented in backend
5. **HTTPS**: Automatically provided by both Render and Netlify

### Performance:
1. **Database Indexes**: Already implemented in PostgreSQL models
2. **Connection Pooling**: Built into Sequelize configuration
3. **CDN**: Netlify includes global CDN automatically
4. **Image Optimization**: Use Next.js Image component
5. **Build Optimization**: Netlify's build optimization features

### Monitoring:
1. **Error Tracking**: Consider adding Sentry
2. **Analytics**: Consider adding Google Analytics
3. **Uptime Monitoring**: Consider UptimeRobot for free monitoring

---

## 📞 Support

If you encounter issues:
1. Check the logs in Render/Netlify dashboards
2. Verify all environment variables are correct
3. Test API endpoints directly
4. Check PostgreSQL connection in Render database dashboard
5. Verify `netlify.toml` configuration for frontend routing

Your Workout Tracker is now ready for production! 🎉