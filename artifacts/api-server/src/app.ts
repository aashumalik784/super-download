import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import router from "./routes";

const app: Express = express();

// CORS sabke liye enable - Vercel se call allow karega
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Request logging
app.use(pinoHttp({ logger }));

// JSON body parse karne ke liye
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check route - Replit zinda hai ya nahi
app.get("/", (req, res) => {
  res.json({ 
    status: "VidGrab API is running", 
    version: "1.0.0",
    timestamp: new Date().toISOString() 
  });
});

// Sare API routes /api ke andar
app.use("/api", router);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
