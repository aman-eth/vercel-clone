import { execSync } from 'child_process'
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


export function logLine(slug, message) {
  publisher.publish(`logs:${slug}`, message);
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
  const fileContent = fs.readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: getContentType(filePath)
  });
  
  await s3Client.send(command);
  console.log(`Uploaded: ${key}`);
  logLine(SLUG, `Uploaded: ${key}`);
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
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await uploadDirectoryToS3(filePath, `${s3Prefix}${file}/`);
    } else {
      const key = `${s3Prefix}${file}`;
      await uploadFileToS3(filePath, key);
    }
  }
  logLine(SLUG, "Upload completed successfully!");
}


(async () => {
  try {
    logLine(SLUG, "Repo cloned...");
    // Install dependencies
    console.log('Installing dependencies...');
    logLine(SLUG, "Installing dependencies...");
    execSync('npm ci', { stdio: 'inherit' });

    // TRY TO STREAM THESE LOGS ALSO

    // Build the project
    console.log('Building project...');
    logLine(SLUG, "Building project...");
    execSync('npm run build', { stdio: 'inherit' });

    console.log('Build completed successfully.');
    logLine(SLUG, "Build completed successfully.");

    // Check if dist directory exists
    if (!fs.existsSync('dist')) {
      console.error('Error: dist directory not found after build');
      logLine(SLUG, "Error: dist directory not found after build");
      process.exit(1);
    }

    console.log('Uploading dist folder to S3...');
    logLine(SLUG, "Uploading dist folder to S3...");
    
    const s3Prefix = `${SLUG}/`;
    
    // Upload dist folder contents
    await uploadDirectoryToS3('dist', s3Prefix);
    
    console.log('Upload completed successfully!');
    logLine(SLUG, "Upload completed successfully!");
    process.exit(1)
  } catch (error) {
    console.error('Build process failed:', error.message);
    logLine(SLUG, 'Build process failed: '+ error.message);
    process.exit(1);
  }
})();

// 575030572555.dkr.ecr.ap-south-1.amazonaws.com/namespace/builder-server:latest