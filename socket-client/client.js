import { io } from "socket.io-client";

const slug = "latest-uploaded-app"; // from /deploy
const socket = io("http://localhost:9000", { query: { slug } });

socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("log", (msg) => {
  console.log("Log:", msg);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});
