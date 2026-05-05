import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const WHITELIST_PATH = join(DATA_DIR, "whitelist.json");

function ensureFile() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!existsSync(WHITELIST_PATH)) {
    writeFileSync(WHITELIST_PATH, JSON.stringify({ users: [] }, null, 2));
  }
}

function loadWhitelist(): number[] {
  ensureFile();
  try {
    const data = JSON.parse(readFileSync(WHITELIST_PATH, "utf-8"));
    return data.users ?? [];
  } catch {
    return [];
  }
}

function saveWhitelist(users: number[]) {
  ensureFile();
  writeFileSync(WHITELIST_PATH, JSON.stringify({ users }, null, 2));
}

export function isWhitelisted(userId: number): boolean {
  return loadWhitelist().includes(userId);
}

export function addToWhitelist(userId: number): boolean {
  const users = loadWhitelist();
  if (users.includes(userId)) return false;
  users.push(userId);
  saveWhitelist(users);
  return true;
}

export function removeFromWhitelist(userId: number): boolean {
  const users = loadWhitelist();
  const idx = users.indexOf(userId);
  if (idx === -1) return false;
  users.splice(idx, 1);
  saveWhitelist(users);
  return true;
}

export function getWhitelistedUsers(): number[] {
  return loadWhitelist();
}
