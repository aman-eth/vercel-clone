'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock, Calendar } from 'lucide-react';

interface DeploymentHistoryItem {
  slug: string;
  url: string;
  repoUrl: string;
  timestamp: string;
  status: 'success' | 'failed' | 'building';
}

export function DeploymentHistory() {
  const [deployments, setDeployments] = useState<DeploymentHistoryItem[]>([]);

  useEffect(() => {
    // Load deployment history from localStorage
    const saved = localStorage.getItem('deployment-history');
    if (saved) {
      setDeployments(JSON.parse(saved));
    }
  }, []);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'building':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (deployments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Deployments
        </CardTitle>
        <CardDescription>
          Your recent deployment history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deployments.map((deployment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getStatusColor(deployment.status)}>
                    {deployment.status}
                  </Badge>
                  <span className="font-mono text-sm text-slate-600">
                    {deployment.slug}
                  </span>
                </div>
                <p className="text-sm text-slate-600 truncate">
                  {deployment.repoUrl}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(deployment.timestamp).toLocaleDateString()}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(deployment.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
