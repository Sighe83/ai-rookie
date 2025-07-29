# 🧪 Testing Guide

## ✅ Backend is Now Running!

Your backend is successfully running on `http://localhost:3001`

## Quick Test Results:
- ✅ Database created and seeded with sample data
- ✅ API health check responding
- ✅ User registration API working
- ✅ Tutors API responding

## 🔍 Test Account Creation:

### B2C Site Testing (Blue Theme):
1. Go to `http://localhost:3001` (frontend)
2. Toggle to B2C mode (blue theme)
3. Click "Tilmeld" (Sign up) button
4. Fill out the form:
   - **Name**: Test User
   - **Email**: test@example.com
   - **Password**: test123
   - **Phone**: +45 12345678
   - Notice: No company/department fields for B2C!

### B2B Site Testing (Green Theme):
1. Toggle to B2B mode (green theme)
2. Click "Tilmeld" (Sign up) button
3. Fill out the form:
   - **Name**: Business User
   - **Email**: business@example.com
   - **Password**: test123
   - **Phone**: +45 12345678
   - **Company**: Test Company
   - **Department**: Marketing
   - Notice: Company/department fields are required for B2B!

## 🚀 What Should Work Now:
- ✅ User registration (different forms for B2B vs B2C)
- ✅ User login
- ✅ User profile management
- ✅ Tutors listing (from real database)
- ✅ Protected booking flow (requires login)
- ✅ Dashboard with real booking data

## 🔧 If You See Issues:
1. Check browser console (F12) for any errors
2. Make sure both servers are running:
   - Frontend: `http://localhost:3001`
   - Backend: `http://localhost:3001/api`
3. Try refreshing the page
4. Check Network tab in DevTools for failed requests

## 📊 Test Data Available:
- **Admin User**: admin@airookie.dk / admin123
- **3 Tutors**: Mette Jensen, Lars Petersen, Anna Kristensen
- **Sample availability**: 14 days of generated time slots
- **Different pricing**: B2B vs B2C pricing automatically applied

## 🎯 Next Steps:
Try creating accounts in both B2B and B2C modes to see the different experiences!