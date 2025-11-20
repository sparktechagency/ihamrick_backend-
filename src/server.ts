import { Server } from "http";
import config from "./config";
import "./shared/database";
import app from "./app";
import { testConnection } from "./helpers/googleCloudStorage";

let server: Server;

async function startServer() {
  // Test Google Cloud Storage connection
  try {
    await testConnection();
    console.log("✓ Google Cloud Storage connected successfully✨");
  } catch (error) {
    console.error("✗ Google Cloud Storage connection failed:", error);
    console.error("Video upload functionality will not work!");
  }

  server = app.listen(config.port, () => {
    console.log("Server is Firing 🚀 on port ", config.port, "🔥");
  });
}

async function main() {
  await startServer();

  const exitHandler = () => {
    if (server) {
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
