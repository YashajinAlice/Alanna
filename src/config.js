require("dotenv").config()

module.exports = {
  // Discord Bot Configuration
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  // Bot Configuration
  prefix: process.env.PREFIX || "!",
  defaultLanguage: process.env.DEFAULT_LANGUAGE || "zh-TW",

  // Development Mode
  devMode: process.env.DEV_MODE === "true",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
}

