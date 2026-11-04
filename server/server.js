import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import folderRouter from "./routes/folderRoutes.js";
import fileRouter from "./routes/fileRoutes.js";
import trashRouter from "./routes/trashRoutes.js";
import shareRouter from "./routes/shareRoutes.js";

const app = express()

// CORS configuration
const rawOrigins = process.env.ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:3000";
const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim().replace(/^["']|["']$/g, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow any localhost or 127.0.0.1 port during development
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isLocalhost || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// Middlewares
app.use(cookieParser())
app.use(express.json({limit: "100mb"}))

// Root API
app.get("/", (_req, res) => res.send("Server is Running"))

// App API routes
app.use("/api/auth", authRouter)
app.use("/api/folders", folderRouter)
app.use("/api/files", fileRouter)
app.use("/api/trash", trashRouter)
app.use("/api/shares", shareRouter)

// Error Handling Middleware
app.use((err, _req, res, _next)=> {
 res.status(err.status || 500).json({error: err.message || "Something went wrong!"})
})

const port = process.env.PORT || 3000;

// Initialize DB connection then start server
initDB().then(()=>{
    app.listen(port, ()=>{
    console.log(`Server running at http://localhost:${port}`)
}) 
})
