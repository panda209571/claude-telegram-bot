import { Router } from "express";
import { getWhitelistedUsers } from "../bot/whitelist.js";
import { ADMIN_IDS } from "../bot/adminCheck.js";

const router = Router();
const startTime = Date.now();

router.get("/bot/status", (_req, res) => {
  const users = getWhitelistedUsers();
  res.json({
    running: true,
    model: "anthropic/claude-opus-4.7",
    whitelistCount: users.length,
    adminCount: ADMIN_IDS.length,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

export default router;
