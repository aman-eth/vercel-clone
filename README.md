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

## 📁 Project Structure

```
vercel-clone/
├── frontend/           # Next.js frontend application
├── api-server/         # Express API server with WebSocket
├── build-server/       # Docker build server
├── reverse-proxy/      # Express reverse proxy
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

Ensure your AWS ECS task definition is configured to:
- Use the build server Docker image
- Accept `REPO_URL` and `SLUG` environment variables
- Have proper IAM permissions for S3 access

## 🚀 Quick Start

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
   - Ensure Docker image is accessible

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
