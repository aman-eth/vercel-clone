import express from "express";
import cors from "cors";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { generate } from "random-words";
import dotenv from "dotenv";

import { createServer } from "http";
import { Server } from "socket.io";
import Redis from "ioredis";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors())
app.use(express.json());

// Wrap Express in HTTP server for Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust in production
  },
});


// Redis client for subscribing to logs
const redisSub = new Redis(process.env.REDIS_URI);

const clientsBySlug = new Map();

// Subscribe to all log channels
redisSub.psubscribe("logs:*", (err) => {
  if (err) console.error("Redis subscription error:", err);
});

// Handle incoming Redis messages
redisSub.on("pmessage", (pattern, channel, message) => {
  const slug = channel.split(":")[1];
  const clients = clientsBySlug.get(slug) || [];
  for (const socket of clients) {
    socket.emit("log", message);
  }
});

// Socket.io connection
io.on("connection", (socket) => {
  const slug = socket.handshake.query.slug;
  if (!slug) {
    socket.disconnect();
    return;
  }

  console.log(`Client connected for slug: ${slug}`);
  if (!clientsBySlug.has(slug)) {
    clientsBySlug.set(slug, new Set());
  }
  clientsBySlug.get(slug).add(socket);

  socket.on("disconnect", () => {
    console.log(`Client disconnected for slug: ${slug}`);
    clientsBySlug.get(slug).delete(socket);
    if (clientsBySlug.get(slug).size === 0) {
      clientsBySlug.delete(slug);
    }
  });
});

// AWS ECS config
const ecsClient = new ECSClient({ 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
 });

// Your ECS settings
const CLUSTER_NAME = "builder-server-cluster";
const TASK_DEFINITION = "15-august-builder-task-definition"; // Include revision if needed
const SUBNETS = ["subnet-00a90fc82586f7d4f", "subnet-05cd0dd13753d9b5f", "subnet-04fdea5ab6f8ee411"]; // Replace with your VPC subnets
const SECURITY_GROUPS = ["sg-02dbc27e4ef3ace3f"]; // Security groups for networking
const LAUNCH_TYPE = "FARGATE";

// POST endpoint to trigger build
app.post("/deploy", async (req, res) => {
  try {
    const { gitRepoUrl, existingSlug } = req.body;
    if (!gitRepoUrl) {
      return res.status(400).json({ error: "gitRepoUrl is required" });
    }

    // Generate random 5-char slug
    const slug = existingSlug ?? generate(3).join("-")

    // ECS run task params
    const params = {
      cluster: CLUSTER_NAME,
      taskDefinition: TASK_DEFINITION,
      launchType: LAUNCH_TYPE,
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: SUBNETS,
          securityGroups: SECURITY_GROUPS,
          assignPublicIp: "ENABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "new-builder-repo", // Must match container name in ECS task definition
            environment: [
              { name: "REPO_URL", value: gitRepoUrl },
              { name: "SLUG", value: slug },
            ],
          },
        ],
      },
    };

    // Run the ECS task
    const command = new RunTaskCommand(params);
    const response = await ecsClient.send(command);

    return res.json({
      message: "Build task started",
      slug,
      url: "http://"+slug+".localhost:8000/",
      ecsResponse: response,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to start ECS task" });
  }
});

// Start server
httpServer.listen(9000, () => {
  console.log("API and Socket.io server running on http://localhost:9000");
});
