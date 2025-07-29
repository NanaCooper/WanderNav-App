# 🚀 WanderNav Production Build Guide

This guide provides step-by-step instructions to build WanderNav into a production-ready APK.

## 📋 Prerequisites

### Required Software
- Node.js (v18 or higher)
- Java JDK 21
- Android Studio (for Android SDK)
- MongoDB (running locally or cloud instance)
- Git

### Required Accounts
- Expo account (free)
- Google Cloud Console (for Maps API key)
- Optional: EAS Build account (for cloud builds)

## 🔧 Backend Setup

### 1. Start MongoDB
```bash
# Install MongoDB if not already installed
# On Windows: Download from https://www.mongodb.com/try/download/community
# On macOS: brew install mongodb-community
# On Linux: sudo apt install mongodb

# Start MongoDB service
mongod
```

### 2. Configure Backend
```bash
cd server

# Update application.yml with your MongoDB connection
# Edit: src/main/resources/application.yml
# Change: host, port, database name if needed

# Update JWT secret for production
# Edit: src/main/resources/application.yml
# Change: jwt.secret to a secure random string
```

### 3. Build and Run Backend
```bash
cd server

# Install dependencies
mvn clean install

# Run the application
mvn spring-boot:run

# Verify backend is running
curl http://localhost:8080/actuator/health
```

## 📱 Frontend Setup

### 1. Install Dependencies
```bash
cd client/WanderNav

# Install dependencies
npm install

# Install Expo CLI globally
npm install -g @expo/cli
```

### 2. Configure Environment
```bash
# Update API base URL for production
# Edit: src/services/api.ts
# Change: API_BASE_URL to your production server URL

# Update Google Maps API key
# Edit: app.json
# Change: googleMapsApiKey to your production API key
```

### 3. Configure App Permissions
The `app.json` file has been updated with all necessary permissions:
- Camera permissions for dashcam
- Location permissions for navigation
- Media library permissions for saving recordings
- Microphone permissions for audio recording

## 🏗️ Building for Production

### Option 1: Local Build (Recommended for Testing)

#### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli

# Login to Expo
eas login
```

#### 2. Configure EAS Build
```bash
# Initialize EAS Build configuration
eas build:configure

# This creates eas.json with build profiles
```

#### 3. Build APK Locally
```bash
# Build for Android
eas build --platform android --local

# Or build for both platforms
eas build --platform all --local
```

### Option 2: Cloud Build (Recommended for Production)

#### 1. Set up EAS Build
```bash
# Configure build profiles
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

### Option 3: Classic Expo Build (Legacy)

#### 1. Build APK
```bash
# Install Expo CLI
npm install -g expo-cli

# Build APK
expo build:android

# Or build for iOS
expo build:ios
```

## 🔍 Pre-Build Testing

### 1. Run Comprehensive Tests
```bash
# Run the comprehensive test suite
node test-comprehensive.js

# Check the generated report
cat audit-report.json
```

### 2. Manual Testing Checklist
- [ ] Backend server running on port 8080
- [ ] MongoDB connection established
- [ ] All API endpoints responding
- [ ] Authentication flow working
- [ ] Camera permissions granted
- [ ] Location permissions granted
- [ ] Dashcam recording working
- [ ] Map navigation working
- [ ] Search functionality working
- [ ] Theme switching working

## 🚀 Production Deployment

### 1. Backend Deployment

#### Option A: Local Server
```bash
# Build JAR file
cd server
mvn clean package

# Run JAR file
java -jar target/wander-backend-0.0.1-SNAPSHOT.jar
```

#### Option B: Cloud Deployment
- **Heroku**: Use Heroku CLI to deploy Spring Boot app
- **AWS**: Use Elastic Beanstalk or EC2
- **Google Cloud**: Use App Engine or Compute Engine
- **Azure**: Use App Service

### 2. Frontend Deployment

#### Update API Configuration
```bash
# Edit: src/services/api.ts
# Update API_BASE_URL to your production server URL
export const API_BASE_URL = 'https://your-production-server.com';
```

#### Build and Deploy
```bash
# Build for production
eas build --platform android --profile production

# Submit to app stores
eas submit --platform android
```

## 🔐 Security Checklist

### Backend Security
- [ ] JWT secret is secure and unique
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] Environment variables used for secrets

### Frontend Security
- [ ] API keys not exposed in client code
- [ ] Sensitive data not logged
- [ ] Input validation on client side
- [ ] Secure storage for tokens
- [ ] Certificate pinning (if needed)

## 📊 Performance Optimization

### Backend Optimization
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Caching implemented
- [ ] Compression enabled
- [ ] Logging optimized

### Frontend Optimization
- [ ] Images optimized and compressed
- [ ] Bundle size minimized
- [ ] Lazy loading implemented
- [ ] Memory leaks fixed
- [ ] Battery usage optimized

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Check if MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Check if Spring Boot is running
curl http://localhost:8080/actuator/health

# Check logs
tail -f logs/application.log
```

#### Frontend Issues
```bash
# Clear Expo cache
expo r -c

# Clear Metro cache
npx react-native start --reset-cache

# Check for missing dependencies
npm audit

# Update Expo SDK if needed
expo upgrade
```

#### Build Issues
```bash
# Clean and rebuild
cd client/WanderNav
rm -rf node_modules
npm install
eas build --clear-cache

# Check EAS build logs
eas build:list
```

## 📱 App Store Submission

### Google Play Store
1. Create Google Play Console account
2. Upload APK/AAB file
3. Fill in app metadata
4. Submit for review

### Apple App Store
1. Create Apple Developer account
2. Upload IPA file via Xcode
3. Fill in app metadata
4. Submit for review

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Build and Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: node test-comprehensive.js
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the audit report
3. Check Expo documentation
4. Check Spring Boot documentation

## 🎯 Success Metrics

After deployment, monitor:
- [ ] App crash rate < 1%
- [ ] API response time < 500ms
- [ ] User engagement metrics
- [ ] Battery usage optimization
- [ ] Memory usage optimization
- [ ] Network usage optimization

---

**🎉 Congratulations! Your WanderNav app is now production-ready!** 