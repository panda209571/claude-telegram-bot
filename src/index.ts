import app from "./app.js";
import "./bot/bot.js";

const port = Number(process.env["PORT"] ?? 3000);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
