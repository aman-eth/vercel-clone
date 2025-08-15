import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import Redis from "ioredis"

import dotenv from "dotenv"
dotenv.config();

const publisher = new Redis(process.env.REDIS_URI);

// Get environment variables
const SLUG = process.env.SLUG;
const S3_BUCKET_NAME = process.env.AWS_BUCKET_NAME;


export async function logLine(slug, message) {
  try {
    await publisher.publish(`logs:${slug}`, message);
  } catch (error) {
    console.error('Failed to publish log:', error);
  }
}

// Function to execute command and stream logs
function executeCommandWithLogs(command, args, slug) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';

    child.stdout.on('data', async (data) => {
      const message = data.toString();
      output += message;
      // Split by lines and log each line
      for (const line of message.split('\n')) {
        if (line.trim()) {
          await logLine(slug, line.trim());
        }
      }
    });

    child.stderr.on('data', async (data) => {
      const message = data.toString();
      output += message;
      // Split by lines and log each line
      for (const line of message.split('\n')) {
        if (line.trim()) {
          await logLine(slug, `ERROR: ${line.trim()}`);
        }
      }
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}


// Initialize S3 client with credentials
const s3Client = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

console.log('Starting build process...');

// Function to upload file to S3
async function uploadFileToS3(filePath, key) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const fileSize = fileContent.length;
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: getContentType(filePath)
    });
    
    await s3Client.send(command);
    console.log(`Uploaded: ${key} (${fileSize} bytes)`);
    await logLine(SLUG, `Uploaded: ${key} (${fileSize} bytes)`);
  } catch (error) {
    console.error(`Failed to upload ${key}:`, error.message);
    await logLine(SLUG, `ERROR: Failed to upload ${key}: ${error.message}`);
    throw error;
  }
}

// Function to get content type based on file extension
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Function to recursively upload directory
async function uploadDirectoryToS3(dirPath, s3Prefix) {
  const files = fs.readdirSync(dirPath);
  console.log({files});
  await logLine(SLUG, `Found ${files.length} items in ${dirPath}`);
  
  let uploadedCount = 0;
  const totalFiles = files.length;
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await logLine(SLUG, `Processing directory: ${file}`);
      await uploadDirectoryToS3(filePath, `${s3Prefix}${file}/`);
    } else {
      const key = `${s3Prefix}${file}`;
      uploadedCount++;
      await logLine(SLUG, `Uploading file ${uploadedCount}/${totalFiles}: ${file}`);
      await uploadFileToS3(filePath, key);
    }
  }
  
  if (dirPath === 'dist') {
    await logLine(SLUG, `Upload completed successfully! Total files uploaded: ${uploadedCount}`);
  }
}


// Cleanup function to ensure Redis connection is closed properly
async function cleanup() {
  try {
    await logLine(SLUG, "Build process finished");
    await logLine(SLUG, "Cleaning up...");
    
    // Close Redis connection
    await publisher.quit();
    
    console.log('Cleanup completed');

     // Wait 5 seconds to ensure all Redis messages are sent
     await logLine(SLUG, "Waiting 5 seconds to ensure all logs are sent...");
     await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, cleaning up...');
  await cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, cleaning up...');
  await cleanup();
  process.exit(0);
});

(async () => {
  try {
    await logLine(SLUG, "Repo cloned...");
    
    // Install dependencies
    console.log('Installing dependencies...');
    await logLine(SLUG, "Installing dependencies...");
    await logLine(SLUG, "Running: npm ci");
    await executeCommandWithLogs('npm', ['ci'], SLUG);
    await logLine(SLUG, "Dependencies installed successfully");

    // Build the project
    console.log('Building project...');
    await logLine(SLUG, "Building project...");
    await logLine(SLUG, "Running: npm run build");
    await executeCommandWithLogs('npm', ['run', 'build'], SLUG);
    await logLine(SLUG, "Build process completed");

    console.log('Build completed successfully.');
    await logLine(SLUG, "Build completed successfully.");

    // Check if dist directory exists
    if (!fs.existsSync('dist')) {
      console.error('Error: dist directory not found after build');
      await logLine(SLUG, "Error: dist directory not found after build");
      await cleanup();
      process.exit(1);
    }

    console.log('Uploading dist folder to S3...');
    await logLine(SLUG, "Uploading dist folder to S3...");
    await logLine(SLUG, `S3 Bucket: ${S3_BUCKET_NAME}`);
    await logLine(SLUG, `S3 Prefix: ${SLUG}/`);
    
    const s3Prefix = `${SLUG}/`;
    
    // Upload dist folder contents
    await uploadDirectoryToS3('dist', s3Prefix);
    
    console.log('Upload completed successfully!');
    await logLine(SLUG, "Upload completed successfully!");
    await logLine(SLUG, "Deployment completed successfully!");
    
    // Cleanup and exit
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Build process failed:', error.message);
    await logLine(SLUG, `Build process failed: ${error.message}`);
    await logLine(SLUG, `Error details: ${error.stack || 'No stack trace available'}`);
    
    // Cleanup and exit with error
    await cleanup();
    process.exit(1);
  }
})();

// Replace with your ECR repository URL
// Example: your-account-id.dkr.ecr.your-region.amazonaws.com/your-repo:latest