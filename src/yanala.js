require("dotenv").config()
const { Client, GatewayIntentBits, Collection } = require("discord.js")
const fs = require("fs")
const path = require("path")
const config = require("./config")
const logger = require("./utils/logger")
const database = require("./utils/database")
const loadEvents = require("./events/index")
const i18n = require("./i18n")

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
})

// Create collections for commands and modals
client.commands = new Collection()
client.modals = new Collection()

// 初始化數據庫
client.database = database

// Load commands from category folders
const commandsPath = path.join(__dirname, "commands")
const commandFolders = fs.readdirSync(commandsPath)

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder)

  // Skip if not a directory
  if (!fs.statSync(folderPath).isDirectory()) continue

  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"))

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file)
    const command = require(filePath)

    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command)
      logger.info(`Loaded command: ${command.data.name} (${folder})`)
    } else {
      logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`)
    }
  }
}

// Load modals
const modalsPath = path.join(__dirname, "modals")
const modalFiles = fs.readdirSync(modalsPath).filter((file) => file.endsWith(".js"))

for (const file of modalFiles) {
  const filePath = path.join(modalsPath, file)
  const modal = require(filePath)

  if ("id" in modal && "execute" in modal) {
    client.modals.set(modal.id, modal)
    logger.info(`Loaded modal: ${modal.id}`)
  } else {
    logger.warn(`The modal at ${filePath} is missing a required "id" or "execute" property.`)
  }
}

// Load events
loadEvents(client)

// Login to Discord with your client's token
client
  .login(config.token)
  .then(() => {
    logger.info(`Bot logged in successfully (Language: ${i18n.defaultLanguage})`)
  })
  .catch((error) => {
    logger.error(`Error logging in: ${error.message}`)
  })

