import { Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import config from "./config";
import "./shared/database";
import app from "./app";
import { testConnection } from "./helpers/googleCloudStorage";
import { corsOptions } from "./app";
import { initializeSocketHandlers } from "./socket/socketHandler";
import { initializeRTMPServer } from "./socket/rtmpServer";

let server: Server;
let io: SocketIOServer;

async function startServer() {
  // Test Google Cloud Storage connection
  try {
    await testConnection();
    console.log("✓ Google Cloud Storage connected successfully✨");
  } catch (error) {
    console.error("✗ Google Cloud Storage connection failed:", error);
    console.error("Video upload functionality will not work!");
  }

  // Create HTTP server
  server = app.listen(config.port, () => {
    console.log("Server is Firing 🚀 on port ", config.port, "🔥");
  });

  // Initialize Socket.IO
  io = new SocketIOServer(server, {
    cors: corsOptions,
    maxHttpBufferSize: 1e8, // 100MB for audio chunks
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Attach io to app for use in controllers
  app.set("io", io);

  // Initialize podcast Socket.IO handlers
  initializeSocketHandlers(io);

  console.log("✓ Socket.IO initialized for audio podcasting");

  // Initialize RTMP server for OBS streaming
  try {
    const rtmpServer = initializeRTMPServer(io);
    rtmpServer.run();
    console.log(`✓ RTMP Server started on port ${config.rtmp.port}`);
    console.log(`✓ HLS Playback available on port ${config.rtmp.httpPort}`);
  } catch (error) {
    console.error("✗ RTMP Server failed to start:", error);
    console.log("  Podcast streaming will work via Socket.IO only");
  }
}

async function main() {
  await startServer();

  const exitHandler = () => {
    if (server) {
      // Close Socket.IO
      if (io) {
        io.close();
      }

      server.close(() => {
        console.info("Server closed!");
        process.exit(0);
      });
    } else {
      process.exit(1);
    }
  };

  process.on("uncaughtException", (error) => {
    console.log("Uncaught Exception: ", error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.log("Unhandled Rejection: ", error);
    exitHandler();
  });

  // Handling the server shutdown with SIGTERM and SIGINT
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received. Shutting down gracefully...");
    exitHandler();
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received. Shutting down gracefully...");
    exitHandler();
  });
}

main();
