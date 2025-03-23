require("dotenv").config()
const { REST, Routes } = require("discord.js")
const fs = require("fs")
const path = require("path")
const config = require("./config")
const logger = require("./utils/logger")

const commands = []
// Grab all the command files from the commands directory and its subdirectories
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

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON())
      logger.info(`Added command for deployment: ${command.data.name} (${folder})`)
    } else {
      logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`)
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(config.token)

// Deploy commands
;(async () => {
  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`)

    // 如果提供了 GUILD_ID 且設置了 DEV_MODE=true，則註冊到特定伺服器
    // 否則註冊為全局命令
    if (config.guildId && config.devMode) {
      // Guild commands (for development)
      logger.info(`Development mode: Registering commands to guild ${config.guildId}...`)

      // First delete all existing guild commands
      logger.info(`Deleting all guild commands for guild ${config.guildId}...`)
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: [] })

      // Then register new commands to the guild
      logger.info(`Registering ${commands.length} guild commands...`)
      const data = await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands })

      logger.info(`Successfully reloaded ${data.length} guild commands.`)
    } else {
      // Global commands (for production)
      logger.info("Registering global commands...")

      // First delete all existing global commands
      logger.info("Deleting all existing global commands...")
      await rest.put(Routes.applicationCommands(config.clientId), { body: [] })

      // Then register new global commands
      logger.info(`Registering ${commands.length} global commands...`)
      const data = await rest.put(Routes.applicationCommands(config.clientId), { body: commands })

      logger.info(`Successfully reloaded ${data.length} global commands.`)
    }
  } catch (error) {
    logger.error(`Error deploying commands: ${error}`)
  }
})()

