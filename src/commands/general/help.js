const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const fs = require("fs")
const path = require("path")
const i18n = require("../../i18n")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("顯示可用指令列表")
    .addStringOption((option) => option.setName("command").setDescription("獲取特定指令的詳細信息").setRequired(false)),
  category: "general",
  execute: async (interaction) => {
    const commandName = interaction.options.getString("command")

    // If a specific command is requested
    if (commandName) {
      const command = interaction.client.commands.get(commandName)

      if (!command) {
        return interaction.reply({
          content: i18n.t("HELP_COMMAND.COMMAND_NOT_FOUND", undefined, { command: commandName }),
          ephemeral: true,
        })
      }

      const embed = new EmbedBuilder()
        .setTitle(i18n.t("HELP_COMMAND.COMMAND_DETAIL_TITLE", undefined, { command: command.data.name }))
        .setDescription(command.data.description)
        .setColor(0x3498db)

      // Add options if they exist
      if (command.data.options && command.data.options.length > 0) {
        let optionsText = ""
        command.data.options.forEach((option) => {
          optionsText += `**${option.name}**: ${option.description}\n`
          optionsText += `${i18n.t("HELP_COMMAND.REQUIRED")}: ${option.required ? i18n.t("HELP_COMMAND.YES") : i18n.t("HELP_COMMAND.NO")}\n\n`
        })
        embed.addFields({ name: i18n.t("HELP_COMMAND.OPTIONS"), value: optionsText })
      }

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    // If no specific command is requested, show all commands grouped by category
    const embed = new EmbedBuilder()
      .setTitle(i18n.t("HELP_COMMAND.TITLE"))
      .setDescription(i18n.t("HELP_COMMAND.DESCRIPTION"))
      .setColor(0x3498db)

    // Group commands by category
    const categories = {}

    for (const [name, command] of interaction.client.commands) {
      const category = command.category || "misc"

      if (!categories[category]) {
        categories[category] = []
      }

      categories[category].push(`**/${command.data.name}**: ${command.data.description}`)
    }

    // Add each category as a field
    for (const [category, commands] of Object.entries(categories)) {
      embed.addFields({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: commands.join("\n"),
      })
    }

    embed.setFooter({ text: i18n.t("HELP_COMMAND.FOOTER") })

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}

