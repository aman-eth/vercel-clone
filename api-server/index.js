import express from "express";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import { generate } from "random-words";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

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
const TASK_DEFINITION = "builder-server-task-definition:1"; // Include revision if needed
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
            name: "builder-server-repo-uri", // Must match container name in ECS task definition
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
app.listen(9000, () => {
  console.log("API running on http://localhost:9000");
});
