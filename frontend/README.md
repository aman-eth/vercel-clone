# Vercel Clone Frontend

A modern Next.js frontend for deploying React applications with real-time deployment logs.

## Features

- 🚀 **One-click deployment** - Deploy React apps from GitHub repositories
- 📊 **Real-time logs** - Live streaming of deployment progress via WebSocket
- 🎨 **Modern UI** - Beautiful interface built with shadcn/ui components
- 📱 **Responsive design** - Works perfectly on desktop and mobile
- 🔗 **Direct access** - Copy deployment URLs and open them directly

## Prerequisites

Before running the frontend, make sure you have the following services running:

1. **API Server** (port 9000) - Handles deployment requests
2. **Reverse Proxy** (port 8000) - Serves deployed applications
3. **Redis** - For WebSocket log streaming
4. **AWS ECS** - For containerized builds

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Paste Repository URL:**
   - Enter a public GitHub repository URL in the input field
   - Example: `https://github.com/username/react-app`

2. **Deploy:**
   - Click the "Deploy" button to start the deployment process
   - The system will generate a unique slug for your deployment

3. **Monitor Progress:**
   - Watch real-time logs as your application builds and deploys
   - The logs show the complete build process from cloning to deployment

4. **Access Your App:**
   - Once deployed, you'll receive a unique URL
   - Click the external link icon to open your deployed application
   - Use the copy button to share the URL

## Architecture

```
Frontend (Next.js) → API Server → AWS ECS → Build Server
     ↓                    ↓           ↓           ↓
WebSocket ←─────────── Redis ←─────── Logs ←─── Build Process
```

## Components

- **Deployment Form** - Input for GitHub repository URL
- **Deployment Status** - Shows deployment URL and slug
- **Live Logs** - Real-time streaming of build logs
- **Deployment Details** - Technical information about the deployment

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible UI components
- **Socket.io** - Real-time WebSocket communication
- **Lucide React** - Beautiful icons

## Environment Variables

The frontend connects to the following services:

- API Server: `http://localhost:9000`
- WebSocket: `http://localhost:9000`
- Deployed apps: `http://localhost:8000`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Main deployment page
│   └── globals.css     # Global styles
├── components/         # Reusable components
│   └── ui/            # shadcn/ui components
└── lib/               # Utility functions
    └── utils.ts       # Tailwind CSS utilities
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Ensure the API server is running on port 9000
   - Check that Redis is properly configured

2. **Deployment Fails**
   - Verify the GitHub repository is public
   - Check that the repository contains a valid React application
   - Ensure AWS ECS is properly configured

3. **Logs Not Streaming**
   - Check WebSocket connection status
   - Verify Redis is running and accessible
   - Check browser console for connection errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
