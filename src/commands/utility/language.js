const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const i18n = require("../../i18n")
const database = require("../../utils/database")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("language")
    .setDescription("設置機器人語言")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option.setName("language").setDescription("選擇語言").setRequired(true).addChoices(
        { name: "繁體中文", value: "zh-TW" },
        { name: "English", value: "en" },
        // 你可以在這裡添加更多語言選項
      ),
    ),
  category: "utility",
  execute: async (interaction) => {
    const language = interaction.options.getString("language")

    if (i18n.setDefaultLanguage(language)) {
      // 如果在伺服器中執行，保存伺服器設置
      if (interaction.guild) {
        const serverId = interaction.guild.id
        database.updateServerSettings(serverId, { language })
        await interaction.reply(`伺服器語言已設置為: ${language}`)
      } else {
        // 如果是在私信中執行，保存用戶設置
        const userId = interaction.user.id
        database.updateUserSettings(userId, { language })
        await interaction.reply(`您的語言已設置為: ${language}`)
      }
    } else {
      await interaction.reply(`無法設置語言: ${language}`)
    }
  },
}

