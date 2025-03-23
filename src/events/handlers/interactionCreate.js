const { Events } = require("discord.js")
const logger = require("../../utils/logger")
const database = require("../../utils/database")
const i18n = require("../../i18n")

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    // 如果是在伺服器中，獲取伺服器設置
    if (interaction.guild) {
      const serverId = interaction.guild.id
      const serverData = database.getServer(serverId)

      // 設置當前語言
      const serverLanguage = serverData.settings.language
      if (serverLanguage) {
        i18n.setDefaultLanguage(serverLanguage)
      }
    }

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName)

      if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`)
        return
      }

      try {
        // 記錄命令使用
        if (interaction.guild) {
          database.logCommandUsage(interaction.guild.id, interaction.user.id, interaction.commandName)
        }

        await command.execute(interaction)
      } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}: ${error}`)
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: i18n.t("GENERAL.COMMAND_ERROR"),
            ephemeral: true,
          })
        } else {
          await interaction.reply({
            content: i18n.t("GENERAL.COMMAND_ERROR"),
            ephemeral: true,
          })
        }
      }
    }

    // Handle modals
    else if (interaction.isModalSubmit()) {
      const modalId = interaction.customId

      // 跳過處理票口相關的模態表單，這些將由專門的處理程序處理
      if (modalId === "close_ticket_modal") {
        return
      }

      try {
        const modalPath = `../../modals/${modalId}.js`
        const modal = require(modalPath)
        await modal.execute(interaction)
      } catch (error) {
        logger.error(`Error handling modal ${modalId}: ${error}`)
        if (!interaction.replied) {
          await interaction.reply({
            content: i18n.t("GENERAL.ERROR"),
            ephemeral: true,
          })
        }
      }
    }
  },
}

