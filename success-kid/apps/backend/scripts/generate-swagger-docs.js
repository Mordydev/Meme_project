/**
 * Generate Swagger Documentation
 * 
 * This script generates OpenAPI documentation from the API endpoints
 */
const fs = require('fs');
const path = require('path');

// Import the app and start it temporarily to generate docs
async function generateSwaggerDocs() {
  console.log('Generating Swagger documentation...');
  
  try {
    // Set NODE_ENV to make sure we don't connect to real services
    process.env.NODE_ENV = 'test';
    
    // Setup path aliases for TypeScript
    require('ts-node').register({
      compilerOptions: {
        module: 'commonjs',
        baseUrl: './src',
        paths: {
          '@/*': ['*']
        }
      }
    });
    
    // Import the app
    const { buildApp } = require('../src/app');
    
    // Create the app
    const app = await buildApp({
      logger: false, // Disable logging
    });
    
    // Generate Swagger docs
    const swaggerDocs = app.swagger();
    
    // Create output directory if it doesn't exist
    const distDir = path.join(__dirname, '../dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(
      path.join(distDir, 'openapi.json'),
      JSON.stringify(swaggerDocs, null, 2)
    );
    
    console.log('Swagger documentation generated successfully');
    console.log(`Output: ${path.join(distDir, 'openapi.json')}`);
    
    // Close the app to free resources
    await app.close();
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating Swagger documentation:', error);
    process.exit(1);
  }
}

// Run the generator
generateSwaggerDocs();
