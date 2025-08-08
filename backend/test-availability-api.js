const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testAvailabilityAPI() {
  const prisma = new PrismaClient();
  try {
    console.log('🧪 TESTING AVAILABILITY API DATA TRANSFORMATION');
    console.log('='.repeat(60));
    
    // Get raw data from database
    const tutorId = 'b1cdef00-1d2e-3f4a-5b6c-7d8e9f0a1b2d';
    const start = new Date();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    console.log('1. RAW DATABASE QUERY:');
    const timeSlots = await prisma.tutorTimeSlot.findMany({
      where: {
        tutorId: tutorId,
        date: { gte: start, lte: end },
        status: 'AVAILABLE'
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 5
    });
    
    console.log('Raw slots from DB:');
    timeSlots.forEach(slot => {
      console.log(`  Date: ${slot.date.toISOString().split('T')[0]}, Start: ${slot.startTime.toTimeString().substring(0, 5)}, Status: ${slot.status}`);
    });
    
    console.log('\n2. API TRANSFORMATION LOGIC:');
    // Simulate the API transformation
    const groupedData = {};
    timeSlots.forEach(slot => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = {
          date: dateKey,
          timeSlots: [],
          hasAvailability: false
        };
      }
      groupedData[dateKey].timeSlots.push({
        time: slot.startTime.toTimeString().substring(0, 5),
        status: slot.status,
        clientName: slot.clientName
      });
      if (slot.status === 'AVAILABLE') {
        groupedData[dateKey].hasAvailability = true;
      }
    });
    
    const transformedAvailability = Object.values(groupedData);
    
    console.log('Transformed API response:');
    transformedAvailability.forEach(day => {
      console.log(`  ${day.date}: ${day.timeSlots.length} slots, hasAvailability: ${day.hasAvailability}`);
      day.timeSlots.forEach(slot => {
        console.log(`    - ${slot.time}: ${slot.status}`);
      });
    });
    
    console.log('\n3. TESTING WHAT FRONTEND MIGHT BE RECEIVING:');
    // Check if there are any issues with the API route itself
    const express = require('express');
    const { databaseService } = require('./src/config/database');
    
    // Simulate the API call
    console.log('Simulating API call...');
    const tutor = await databaseService.findUnique('tutor', {
      where: { id: tutorId, isActive: true }
    });
    
    if (!tutor) {
      console.log('❌ Tutor not found');
      return;
    }
    
    const apiTimeSlots = await databaseService.findMany('tutorTimeSlot', {
      where: {
        tutorId: tutorId,
        date: { gte: start, lte: end },
        status: 'AVAILABLE'
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });
    
    console.log(`API query returned ${apiTimeSlots.length} slots`);
    
    const apiGroupedData = {};
    apiTimeSlots.forEach(slot => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!apiGroupedData[dateKey]) {
        apiGroupedData[dateKey] = {
          date: dateKey,
          timeSlots: [],
          hasAvailability: false
        };
      }
      apiGroupedData[dateKey].timeSlots.push({
        time: slot.startTime.toTimeString().substring(0, 5),
        status: slot.status,
        clientName: slot.clientName
      });
      if (slot.status === 'AVAILABLE') {
        apiGroupedData[dateKey].hasAvailability = true;
      }
    });

    const apiResponse = Object.values(apiGroupedData);
    
    console.log('\nFinal API response structure:');
    console.log(JSON.stringify(apiResponse.slice(0, 2), null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAvailabilityAPI();