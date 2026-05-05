import TelegramBot from "node-telegram-bot-api";
import { isAdmin, ADMIN_IDS } from "./adminCheck.js";
import {
  isWhitelisted,
  addToWhitelist,
  removeFromWhitelist,
  getWhitelistedUsers,
} from "./whitelist.js";
import { chat, clearHistory, getHistoryLength } from "./ai.js";

const token = process.env["TELEGRAM_BOT_TOKEN"];
if (!token) throw new Error("TELEGRAM_BOT_TOKEN environment variable is required.");

const bot = new TelegramBot(token, { polling: true });

function getUserId(msg: TelegramBot.Message): number {
  return msg.from?.id ?? 0;
}

function getUserName(msg: TelegramBot.Message): string {
  const f = msg.from;
  if (!f) return "Unknown";
  return f.username ? `@${f.username}` : [f.first_name, f.last_name].filter(Boolean).join(" ");
}

function isAuthorized(userId: number): boolean {
  return isAdmin(userId) || isWhitelisted(userId);
}

bot.onText(/\/start/, (msg) => {
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAuthorized(userId)) {
    bot.sendMessage(chatId, "⛔ You are not authorized to use this bot. Please contact the admin to get access.");
    return;
  }
  bot.sendMessage(chatId, `👋 Hello ${getUserName(msg)}!\n\nI'm an AI assistant powered by Claude Opus 4.7.\n\nJust send me any message and I'll respond. Here are some useful commands:\n\n/start — Show this message\n/new — Start a new conversation\n/history — Show conversation length\n/help — Show all commands`);
});

bot.onText(/\/help/, (msg) => {
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAuthorized(userId)) {
    bot.sendMessage(chatId, "⛔ You are not authorized to use this bot.");
    return;
  }
  let helpText = `📋 *Commands*\n\n*General:*\n/start — Welcome message\n/new — Clear conversation history\n/history — Show message count\n/help — This help message`;
  if (isAdmin(userId)) {
    helpText += `\n\n*Admin Commands:*\n/whitelist — List whitelisted users\n/add <user\\_id> — Add user to whitelist\n/remove <user\\_id> — Remove user from whitelist\n/admins — Show admin IDs`;
  }
  bot.sendMessage(chatId, helpText, { parse_mode: "Markdown" });
});

bot.onText(/\/new/, (msg) => {
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAuthorized(userId)) {
    bot.sendMessage(chatId, "⛔ You are not authorized to use this bot.");
    return;
  }
  clearHistory(userId);
  bot.sendMessage(chatId, "🔄 Conversation cleared. Let's start fresh!");
});

bot.onText(/\/history/, (msg) => {
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAuthorized(userId)) {
    bot.sendMessage(chatId, "⛔ You are not authorized to use this bot.");
    return;
  }
  const count = getHistoryLength(userId);
  bot.sendMessage(chatId, `📊 Your conversation has *${count}* message(s) in history.`, { parse_mode: "Markdown" });
});

bot.onText(/\/whitelist/, (msg) => {
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, "⛔ This command is for admins only.");
    return;
  }
  const users = getWhitelistedUsers();
  if (users.length === 0) {
    bot.sendMessage(chatId, "📋 Whitelist is currently empty.");
    return;
  }
  const list = users.map((id) => `• \`${id}\``).join("\n");
  bot.sendMessage(chatId, `📋 *Whitelisted Users:*\n${list}`, { parse_mode: "Markdown" });
});

bot.onText(/\/add(?:\s+(.+))?/, (msg, match) => {
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, "⛔ This command is for admins only.");
    return;
  }
  const targetId = Number(match?.[1]?.trim());
  if (!targetId || isNaN(targetId)) {
    bot.sendMessage(chatId, "❌ Usage: /add <user\\_id>", { parse_mode: "Markdown" });
    return;
  }
  const added = addToWhitelist(targetId);
  bot.sendMessage(chatId, added ? `✅ User \`${targetId}\` added to whitelist.` : `ℹ️ User \`${targetId}\` is already whitelisted.`, { parse_mode: "Markdown" });
});

bot.onText(/\/remove(?:\s+(.+))?/, (msg, match) => {
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, "⛔ This command is for admins only.");
    return;
  }
  const targetId = Number(match?.[1]?.trim());
  if (!targetId || isNaN(targetId)) {
    bot.sendMessage(chatId, "❌ Usage: /remove <user\\_id>", { parse_mode: "Markdown" });
    return;
  }
  const removed = removeFromWhitelist(targetId);
  bot.sendMessage(chatId, removed ? `✅ User \`${targetId}\` removed from whitelist.` : `ℹ️ User \`${targetId}\` was not in the whitelist.`, { parse_mode: "Markdown" });
});

bot.onText(/\/admins/, (msg) => {
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAdmin(userId)) {
    bot.sendMessage(chatId, "⛔ This command is for admins only.");
    return;
  }
  const list = ADMIN_IDS.map((id) => `• \`${id}\``).join("\n");
  bot.sendMessage(chatId, `👑 *Admin IDs:*\n${list}`, { parse_mode: "Markdown" });
});

bot.on("message", async (msg) => {
  const text = msg.text;
  if (!text || text.startsWith("/")) return;
  const userId = getUserId(msg);
  const chatId = msg.chat.id;
  if (!isAuthorized(userId)) {
    bot.sendMessage(chatId, "⛔ You are not authorized to use this bot. Please contact the admin to get access.");
    return;
  }
  try {
    await bot.sendChatAction(chatId, "typing");
    const response = await chat(userId, text);
    const MAX_LENGTH = 4096;
    if (response.length <= MAX_LENGTH) {
      await bot.sendMessage(chatId, response);
    } else {
      for (let i = 0; i < response.length; i += MAX_LENGTH) {
        await bot.sendMessage(chatId, response.slice(i, i + MAX_LENGTH));
      }
    }
  } catch (err) {
    console.error("Error processing message:", err);
    bot.sendMessage(chatId, "❌ Sorry, something went wrong. Please try again.");
  }
});

bot.on("polling_error", (err) => console.error("Polling error:", err));
bot.on("error", (err) => console.error("Bot error:", err));

console.log("Telegram bot started with polling");
export { bot };
