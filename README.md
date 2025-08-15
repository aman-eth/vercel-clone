# Vercel Clone

A complete Vercel-like deployment platform with a modern Next.js frontend, API server, build server, and reverse proxy.

## 🚀 Features

- **One-click deployment** - Deploy React apps from GitHub repositories
- **Real-time logs** - Live streaming of deployment progress via WebSocket
- **Modern UI** - Beautiful interface built with Next.js and shadcn/ui
- **Containerized builds** - AWS ECS-based build system
- **Reverse proxy** - Automatic subdomain routing for deployed apps
- **Deployment history** - Track and manage your deployments

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Build Server  │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (Docker)      │
│   Port: 3000    │    │   Port: 9000    │    │   AWS ECS       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │     Redis       │    │   S3 Storage    │
         │              │   (WebSocket)   │    │   (Static)      │
         │              └─────────────────┘    └─────────────────┘
         │                       ▲                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Reverse Proxy   │
                    │   Port: 8000    │
                    └─────────────────┘
```

## 🛠️ Key Technologies & AWS Services

### **AWS ECS (Elastic Container Service)**
- **Purpose**: Container orchestration for build processes
- **Usage**: Runs Docker containers for each deployment
- **Learning Value**: Task definitions, auto-scaling, container management

### **AWS ECR (Elastic Container Registry)**
- **Purpose**: Store and manage Docker images
- **Usage**: Hosts the build-server container image
- **Learning Value**: Container image lifecycle management

### **AWS S3 (Simple Storage Service)**
- **Purpose**: Store built static files
- **Usage**: Hosts deployed application assets
- **Learning Value**: Object storage, bucket policies, static hosting

### **Redis Pub/Sub**
- **Purpose**: Real-time log streaming
- **Usage**: WebSocket communication for build logs
- **Learning Value**: Event-driven architecture, real-time systems

### **Docker Containerization**
- **Purpose**: Package build environment
- **Usage**: Consistent build environment across deployments
- **Learning Value**: Container orchestration, image building

## 📁 Project Structure

```
vercel-clone/
├── frontend/           # Next.js frontend with shadcn/ui
├── api-server/         # Express API with WebSocket support
├── build-server/       # Docker container for building apps
│   ├── Dockerfile      # Container image definition
│   ├── build-script.js # Build logic and S3 upload
│   └── README.md       # ECR deployment instructions
├── reverse-proxy/      # Express proxy for serving apps
└── socket-client/      # WebSocket client example
```

## 🛠️ Prerequisites

Before running this project, you need:

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Redis** server running locally or remotely
4. **AWS Account** with ECS configured
5. **Docker** (for local development)

## ⚙️ Environment Setup

### 1. API Server Environment Variables

Create a `.env` file in the `api-server/` directory:

```env
# AWS Configuration
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Redis Configuration
REDIS_URI=redis://localhost:6379

# ECS Configuration
ECS_CLUSTER_NAME=your-ecs-cluster-name
ECS_TASK_DEFINITION=your-task-definition-name
ECS_CONTAINER_NAME=your-container-name
ECS_SUBNETS=subnet-xxx,subnet-yyy,subnet-zzz
ECS_SECURITY_GROUPS=sg-xxx

# S3 Configuration
S3_BASE_PATH=https://your-s3-bucket.s3.your-region.amazonaws.com/
```

### 2. Build Server Configuration

The build server is a Docker container that needs to be deployed to AWS ECR:

1. **Build and Push to ECR:**
   ```bash
   cd build-server
   docker build -t build-server .
   docker tag build-server:latest your-account-id.dkr.ecr.your-region.amazonaws.com/build-server:latest
   docker push your-account-id.dkr.ecr.your-region.amazonaws.com/build-server:latest
   ```

2. **ECS Task Definition Requirements:**
   - Reference the ECR image: `your-account-id.dkr.ecr.your-region.amazonaws.com/build-server:latest`
   - Set required environment variables (see build-server/README.md for details)
   - Configure proper IAM roles for S3 and ECR access
   - Set up VPC networking with public IP assignment

3. **Required Environment Variables for Build Server:**
   - `AWS_REGION` - AWS region
   - `AWS_ACCESS_KEY_ID` - AWS access key
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key
   - `REDIS_URI` - Redis connection string
   - `AWS_BUCKET_NAME` - S3 bucket name
   - `REPO_URL` - GitHub repository URL (set by API server)
   - `SLUG` - Unique deployment identifier (set by API server)

## 🚀 Quick Start

### Prerequisites

Before starting the services, you need to set up the AWS infrastructure:

1. **Deploy Build Server to ECR:**
   ```bash
   cd build-server
   
   # Authenticate to ECR
   aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
   
   # Build and push Docker image
   docker build -t build-server .
   docker tag build-server:latest your-account-id.dkr.ecr.your-region.amazonaws.com/build-server:latest
   docker push your-account-id.dkr.ecr.your-region.amazonaws.com/build-server:latest
   ```

2. **Create ECS Task Definition:**
   - Use the build server image from ECR
   - Configure required environment variables
   - Set up proper IAM roles and permissions

3. **Set up environment variables** (see Environment Setup section below)

### Option 1: Start All Services (Recommended)

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start all services:**
   ```bash
   npm run dev
   ```

This will start:
- Frontend on http://localhost:3000
- API Server on http://localhost:9000
- Reverse Proxy on http://localhost:8000

### Option 2: Start Services Individually

1. **Start API Server:**
   ```bash
   npm run dev:api
   ```

2. **Start Reverse Proxy:**
   ```bash
   npm run dev:proxy
   ```

3. **Start Frontend:**
   ```bash
   npm run dev:frontend
   ```

## 📖 Usage

### 1. Deploy a React App

1. Open http://localhost:3000 in your browser
2. Paste a public GitHub repository URL (e.g., `https://github.com/username/react-app`)
3. Click "Deploy"
4. Watch real-time logs as your app builds and deploys
5. Access your deployed app at the provided URL

### 2. Monitor Deployments

- View real-time build logs in the frontend
- Check deployment history for past deployments
- Copy deployment URLs for sharing

### 3. Access Deployed Apps

Deployed apps are accessible at:
```
http://{slug}.localhost:8000
```

For example, if your slug is `my-app`, the URL would be:
```
http://my-app.localhost:8000
```

## 🔧 Development

### Frontend Development

```bash
cd frontend
npm run dev
```

The frontend is built with:
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Socket.io** for real-time communication

### API Server Development

```bash
cd api-server
npm run dev
```

The API server handles:
- Deployment requests
- WebSocket connections for logs
- AWS ECS task management
- Redis pub/sub for log streaming

### Build Server

The build server runs in AWS ECS and:
- Clones GitHub repositories
- Builds React applications
- Uploads static files to S3
- Streams logs via Redis

### Reverse Proxy

```bash
cd reverse-proxy
npm run dev
```

The reverse proxy:
- Routes requests based on subdomain
- Serves static files from S3
- Handles custom domains (future feature)

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure Redis is running
   - Check API server is on port 9000
   - Verify CORS settings

2. **Deployment Fails**
   - Check AWS credentials
   - Verify ECS task definition
   - Ensure repository is public

3. **Build Server Issues**
   - Check ECS task logs
   - Verify S3 permissions
   - Ensure Docker image is accessible from ECR
   - Verify ECR image is properly pushed and tagged

4. **Reverse Proxy Not Working**
   - Check S3 bucket configuration
   - Verify subdomain routing
   - Ensure port 8000 is accessible

### Debug Mode

Enable debug logging by setting environment variables:

```env
DEBUG=*
NODE_ENV=development
```

## 📝 API Reference

### Deploy Endpoint

**POST** `/deploy`

Request body:
```json
{
  "gitRepoUrl": "https://github.com/username/repository"
}
```

Response:
```json
{
  "message": "Build task started",
  "slug": "unique-slug",
  "url": "http://unique-slug.localhost:8000/",
  "ecsResponse": { ... }
}
```

### WebSocket Events

- **Connect**: `io.connect('http://localhost:9000', { query: { slug: 'your-slug' } })`
- **Log**: `socket.on('log', (message) => { ... })`
- **Disconnect**: `socket.on('disconnect', () => { ... })`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Vercel's deployment platform
- Built with modern web technologies
- Uses AWS ECS for scalable builds
