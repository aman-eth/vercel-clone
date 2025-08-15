# Build Server

This directory contains the Docker container that handles the build process for deployed applications. The build server runs on AWS ECS and is responsible for cloning repositories, installing dependencies, building applications, and uploading static files to S3.

## Overview

The build server is a Node.js application packaged as a Docker container that:
- Clones GitHub repositories
- Installs dependencies (`npm ci`)
- Builds React applications (`npm run build`)
- Uploads static files to S3
- Streams real-time logs via Redis

## Docker Image

The build server is packaged as a Docker image that needs to be uploaded to AWS ECR (Elastic Container Registry) before it can be used by the ECS task definition.

### Building and Pushing to ECR

1. **Authenticate to ECR:**
   ```bash
   aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
   ```

2. **Build the Docker image:**
   ```bash
   docker build -t build-server .
   ```

3. **Tag the image for ECR:**
   ```bash
   docker tag build-server:latest your-account-id.dkr.ecr.your-region.amazonaws.com/build-server:latest
   ```

4. **Push to ECR:**
   ```bash
   docker push your-account-id.dkr.ecr.your-region.amazonaws.com/build-server:latest
   ```

## Required Environment Variables

The build server container requires the following environment variables to be set in the ECS task definition:

### AWS Configuration
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

### Redis Configuration
- `REDIS_URI` - Redis connection string (e.g., redis://your-redis-host:6379)

### S3 Configuration
- `AWS_BUCKET_NAME` - S3 bucket name for storing static files

### Build Configuration
- `REPO_URL` - GitHub repository URL to clone (set by API server)
- `SLUG` - Unique deployment identifier (set by API server)

## ECS Task Definition

The build server image should be referenced in your ECS task definition:

```json
{
  "family": "build-server-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "build-server",
      "image": "your-account-id.dkr.ecr.your-region.amazonaws.com/build-server:latest",
      "essential": true,
      "environment": [
        {
          "name": "AWS_REGION",
          "value": "your-region"
        },
        {
          "name": "REDIS_URI",
          "value": "redis://your-redis-host:6379"
        },
        {
          "name": "AWS_BUCKET_NAME",
          "value": "your-s3-bucket-name"
        }
      ],
      "secrets": [
        {
          "name": "AWS_ACCESS_KEY_ID",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:aws-access-key"
        },
        {
          "name": "AWS_SECRET_ACCESS_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:aws-secret-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/build-server",
          "awslogs-region": "your-region",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Build Process

1. **Repository Cloning:** The container clones the specified GitHub repository
2. **Dependency Installation:** Runs `npm ci` to install dependencies
3. **Build Process:** Executes `npm run build` to create production build
4. **File Upload:** Uploads all files from the `dist` directory to S3
5. **Log Streaming:** All logs are streamed in real-time via Redis pub/sub

## File Structure

```
build-server/
├── Dockerfile          # Docker image definition
├── entrypoint.sh       # Container entry point script
├── build-script.js     # Main build logic
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Troubleshooting

### Common Issues

1. **Build Fails:** Check that the repository contains a valid React application with a `package.json` and build script
2. **S3 Upload Fails:** Verify AWS credentials and S3 bucket permissions
3. **Redis Connection Fails:** Ensure Redis is accessible from the ECS task
4. **Container Exits Early:** Check ECS task logs for error messages

### Logs

All build logs are streamed via Redis and can be viewed in the frontend application. The container also logs to CloudWatch if configured in the task definition.

## Security Considerations

- Use IAM roles instead of access keys when possible
- Store sensitive credentials in AWS Secrets Manager
- Ensure the ECS task has minimal required permissions
- Use private subnets for ECS tasks in production
