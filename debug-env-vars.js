#!/usr/bin/env node

// Debug environment variables to understand what's happening in production

console.log('🔍 Environment Variables Debug');
console.log('==============================');

// Check all environment files
const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.development', '.env.production', '.env.staging'];

envFiles.forEach(filename => {
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    console.log(`\n📄 ${filename}:`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.includes('SUPABASE_URL') && !line.startsWith('#')) {
        console.log(`  ${line}`);
      }
    });
  }
});

// Check process.env if available
console.log('\n🌍 Runtime Environment:');
if (typeof process !== 'undefined' && process.env) {
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  VERCEL_ENV: ${process.env.VERCEL_ENV}`);
  console.log(`  VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL}`);
} else {
  console.log('  Process environment not available (browser context)');
}

// Check import.meta.env if available (Vite)
if (typeof window !== 'undefined' && window.location) {
  console.log('\n🌐 Browser Context:');
  console.log(`  Current URL: ${window.location.href}`);
  console.log(`  Host: ${window.location.host}`);
}

console.log('\n❓ Expected Production URL: https://ycdhzwnjiarflruwavxi.supabase.co');
console.log('❗ Invalid URL reported: dfovfdluhrdmrhtubomt.supabase.co');
console.log('💡 This suggests the production deployment has wrong environment variables set.');

console.log('\n🛠️ Solution:');
console.log('1. Check Vercel dashboard environment variables');
console.log('2. Set VITE_SUPABASE_URL=https://ycdhzwnjiarflruwavxi.supabase.co in production');
console.log('3. Clear browser cache and redeploy');