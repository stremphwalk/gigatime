import type { VercelRequest, VercelResponse } from '@vercel/node';

// Test different levels of imports to isolate the issue
let testResults: any = {
  basicImports: false,
  expressImport: false,
  serverImports: false,
  databaseImport: false,
  schemaImports: false
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Debug] Starting debug handler');
  
  try {
    // Test 1: Basic Node.js functionality
    testResults.basicImports = true;
    console.log('[Debug] Basic imports OK');

    // Test 2: Express import
    try {
      const express = require("express");
      testResults.expressImport = true;
      console.log('[Debug] Express import OK');
    } catch (error) {
      console.error('[Debug] Express import failed:', error);
      testResults.expressImport = { error: error instanceof Error ? error.message : 'Unknown' };
    }

    // Test 3: Server modules
    try {
      const auth = require("../server/auth.js");
      testResults.serverImports = true;
      console.log('[Debug] Server auth import OK');
    } catch (error) {
      console.error('[Debug] Server imports failed:', error);
      testResults.serverImports = { error: error instanceof Error ? error.message : 'Unknown' };
    }

    // Test 4: Database/Storage
    try {
      const storageModule = require("../server/storage.js");
      testResults.databaseImport = true;
      console.log('[Debug] Database import OK');
    } catch (error) {
      console.error('[Debug] Database import failed:', error);
      testResults.databaseImport = { error: error instanceof Error ? error.message : 'Unknown' };
    }

    // Test 5: Schema imports
    try {
      const schemas = require("../shared/schema.js");
      testResults.schemaImports = true;
      console.log('[Debug] Schema imports OK');
    } catch (error) {
      console.error('[Debug] Schema imports failed:', error);
      testResults.schemaImports = { error: error instanceof Error ? error.message : 'Unknown' };
    }

    console.log('[Debug] All tests completed, returning results');
    
    res.status(200).json({
      status: 'success',
      message: 'Debug endpoint executed successfully',
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      testResults: testResults,
      availableEnvVars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        NODE_ENV: process.env.NODE_ENV,
        AUTH0_CLIENT_ID: !!process.env.AUTH0_CLIENT_ID
      }
    });

  } catch (error) {
    console.error('[Debug] Top-level error in debug handler:', error);
    res.status(500).json({
      status: 'error',
      message: 'Debug handler failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      testResults: testResults,
      timestamp: new Date().toISOString()
    });
  }
}