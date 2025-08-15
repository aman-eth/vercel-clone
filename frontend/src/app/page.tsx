'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Github, Play, ExternalLink, Copy, Check } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { DeploymentHistory } from '@/components/deployment-history';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

interface DeploymentResponse {
  message: string;
  slug: string;
  url: string;
  ecsResponse: Record<string, unknown>;
}

interface DeploymentHistoryItem {
  slug: string;
  url: string;
  repoUrl: string;
  timestamp: string;
  status: 'success' | 'failed' | 'building';
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployment, setDeployment] = useState<DeploymentResponse | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const handleDeploy = async () => {
    if (!repoUrl.trim()) return;

    setIsDeploying(true);
    setLogs([]);
    setDeployment(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:9000/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gitRepoUrl: repoUrl }),
      });

      const data: DeploymentResponse = await response.json();
      setDeployment(data);

      // Add to deployment history
      const historyItem: DeploymentHistoryItem = {
        slug: data.slug,
        url: data.url,
        repoUrl: repoUrl,
        timestamp: new Date().toISOString(),
        status: 'building'
      };
      
      const saved = localStorage.getItem('deployment-history');
      const history: DeploymentHistoryItem[] = saved ? JSON.parse(saved) : [];
      const updatedHistory = [historyItem, ...history.slice(0, 9)];
      localStorage.setItem('deployment-history', JSON.stringify(updatedHistory));

      // Connect to WebSocket for logs
      const newSocket = io('http://localhost:9000', {
        query: { slug: data.slug }
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket for logs');
        setLogs(prev => [...prev, 'Connected to deployment logs...']);
      });

      newSocket.on('log', (message: string) => {
        setLogs(prev => [...prev, message]);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
        setLogs(prev => [...prev, 'Disconnected from deployment logs']);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Deployment failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Deployment failed. Please try again.';
      setError(errorMessage);
      setLogs(prev => [...prev, `Error: ${errorMessage}`]);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Vercel Clone
          </h1>
          <p className="text-slate-600">
            Deploy your React apps with ease
          </p>
        </div>

        {/* Deployment Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Deploy Repository
            </CardTitle>
            <CardDescription>
              Paste your public GitHub repository URL to start deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="flex-1"
                disabled={isDeploying}
              />
              <Button 
                onClick={handleDeploy} 
                disabled={!repoUrl.trim() || isDeploying}
                className="min-w-[120px]"
              >
                {isDeploying ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2 text-white" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Deploy
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <ErrorMessage message={error} />
            )}
          </CardContent>
        </Card>

        {/* Deployment Status */}
        {deployment && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Deployment Status</span>
                <Badge variant="secondary">{deployment.slug}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-800">Deployment URL</p>
                  <p className="text-sm text-green-600">{deployment.url}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(deployment.url)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(deployment.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    View Deployment Details
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deployment Details</AlertDialogTitle>
                    <AlertDialogDescription>
                      Technical details of your deployment
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="text-xs bg-slate-100 p-4 rounded">
                      {JSON.stringify(deployment.ecsResponse, null, 2)}
                    </pre>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogAction>Close</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}

        {/* Live Logs */}
        {(isDeploying || logs.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Deployment Logs</span>
                {socket && (
                  <Badge variant="outline" className="text-green-600">
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Real-time logs from your deployment process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    Waiting for logs...
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                    </div>
                  ))
                )}
              </div>
              
              {logs.length > 0 && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogs([])}
                  >
                    Clear Logs
                  </Button>
                  {socket && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectSocket}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Deployment History */}
        <DeploymentHistory />
      </div>
    </div>
  );
}
