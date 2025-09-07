#!/usr/bin/env node

import { config } from 'dotenv';

// Load environment variables
config();

console.log('🧪 Testing Gigatime AI Integration with Amazon Nova Micro\n');

// Test API endpoints
async function testAIEndpoint(endpoint, testData) {
  const url = `http://localhost:5002/api/ai/${endpoint}`;
  
  try {
    console.log(`🚀 Testing ${endpoint} endpoint...`);
    console.log(`Input: "${testData}"`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dictation: testData })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log(`Output: "${result.text}"`);
      console.log('---');
      return true;
    } else {
      console.log('❌ Failed!');
      console.log(`Error: ${result.message}`);
      console.log('---');
      return false;
    }
  } catch (error) {
    console.log('❌ Network Error!');
    console.log(`Error: ${error.message}`);
    console.log('---');
    return false;
  }
}

async function runTests() {
  console.log('📋 Testing all AI endpoints:\n');
  
  // Test data for each endpoint
  const tests = [
    {
      endpoint: 'medications',
      data: 'The patient is taking metformin 500 milligrams twice daily and lisinopril 10 mg once daily for blood pressure.'
    },
    {
      endpoint: 'labs',
      data: 'Hemoglobin is 68, down from previous values of 63 and 67. White blood cell count 5.2. Platelets 350.'
    },
    {
      endpoint: 'pmh',
      data: 'Diabetes mellitus type 2, last A1C was 5.6 in May 2025, on metformin. Also has hypertension, well controlled.'
    }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const success = await testAIEndpoint(test.endpoint, test.data);
    if (success) successCount++;
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎯 Results: ${successCount}/${tests.length} tests passed`);
  
  if (successCount === tests.length) {
    console.log('🎉 All AI endpoints working perfectly!');
    console.log('\n💡 How to test in the UI:');
    console.log('1. Go to http://localhost:5002');
    console.log('2. Create or edit a note');
    console.log('3. Look for AI buttons next to Medications, Labs, and PMH sections');
    console.log('4. Click an AI button and try voice dictation or text input');
  } else {
    console.log('⚠️ Some tests failed. Check your AWS credentials and Bedrock access.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    console.log('2. Ensure you have requested Amazon Bedrock model access');
    console.log('3. Check that Nova Micro is available in your AWS region');
  }
}

// Check if server is running first
console.log('🔍 Checking if dev server is running...');
try {
  const response = await fetch('http://localhost:5002/api/auth/user');
  if (response.ok) {
    console.log('✅ Dev server is running!\n');
    await runTests();
  } else {
    console.log('❌ Server responded but with error');
    console.log('💡 Make sure to run: npm run dev:no-auth');
  }
} catch (error) {
  console.log('❌ Cannot connect to dev server');
  console.log('💡 Please start the server first: npm run dev:no-auth');
  console.log('💡 Then run this test again: node test-ai.js');
}
