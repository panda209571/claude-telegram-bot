import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import botRouter from "./routes/bot.js";
import whitelistRouter from "./routes/whitelist.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", healthRouter);
app.use("/api", botRouter);
app.use("/api", whitelistRouter);

export default app;
