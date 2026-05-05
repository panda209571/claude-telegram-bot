import { Router } from "express";
import {
  getWhitelistedUsers,
  addToWhitelist,
  removeFromWhitelist,
} from "../bot/whitelist.js";

const router = Router();

router.get("/whitelist", (_req, res) => {
  const users = getWhitelistedUsers();
  res.json({ users, total: users.length });
});

router.post("/whitelist", (req, res) => {
  const { userId } = req.body;
  if (typeof userId !== "number") {
    res.status(400).json({ error: "userId must be a number" });
    return;
  }
  const added = addToWhitelist(userId);
  res.status(added ? 200 : 409).json({
    success: added,
    message: added ? `User ${userId} added to whitelist` : `User ${userId} is already whitelisted`,
    userId,
  });
});

router.delete("/whitelist/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ error: "User ID must be a number" });
    return;
  }
  const removed = removeFromWhitelist(userId);
  res.status(removed ? 200 : 404).json({
    success: removed,
    message: removed ? `User ${userId} removed from whitelist` : `User ${userId} was not in the whitelist`,
    userId,
  });
});

export default router;
