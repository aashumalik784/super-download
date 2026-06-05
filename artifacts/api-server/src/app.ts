import express from "express";
import cors from "cors";
import videoRouter from "./video";
import healthRouter from "./health";

const app = express();

// CORS - Vercel ke liye sabse zaroori
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", healthRouter);
app.use("/api", videoRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
