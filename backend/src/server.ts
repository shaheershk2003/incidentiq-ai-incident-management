import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectSQLServer } from "./config/database";
import { connectMongoDB } from "./config/mongodb";
import authRoutes from "./routes/authRoutes";
import incidentRoutes from "./routes/incidentRoutes";
import userRoutes from "./routes/userRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/*
 * Snapshot images are sent as Base64 data URLs.
 * A 5 MB image becomes larger after Base64 encoding,
 * so the JSON request limit must be higher than 5 MB.
 */
app.use(express.json({
  limit: "10mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "10mb"
}));

app.use(cors());

app.use("/api/incidents", incidentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Incident Management API is running"
  });
});

async function startServer() {
  try {
    await connectSQLServer();
    await connectMongoDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();