const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js")
const database = require("../../utils/database")
const i18n = require("../../i18n")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("管理伺服器設置")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) => subcommand.setName("view").setDescription("查看當前伺服器設置"))
    .addSubcommand((subcommand) =>
      subcommand
        .setName("language")
        .setDescription("設置伺服器語言")
        .addStringOption((option) =>
          option.setName("language").setDescription("選擇語言").setRequired(true).addChoices(
            { name: "繁體中文", value: "zh-TW" },
            { name: "English", value: "en" },
            // 你可以在這裡添加更多語言選項
          ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("welcome")
        .setDescription("設置歡迎訊息")
        .addChannelOption((option) => option.setName("channel").setDescription("選擇歡迎訊息頻道").setRequired(true))
        .addStringOption((option) =>
          option.setName("message").setDescription("設置歡迎訊息 (使用 {user} 代表新成員)").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("log")
        .setDescription("設置日誌頻道")
        .addChannelOption((option) => option.setName("channel").setDescription("選擇日誌頻道").setRequired(true)),
    ),
  category: "admin",
  execute: async (interaction) => {
    const serverId = interaction.guild.id
    const subcommand = interaction.options.getSubcommand()

    // 獲取伺服器設置
    const serverData = database.getServer(serverId)

    // 處理不同的子命令
    switch (subcommand) {
      case "view":
        // 顯示當前設置
        const embed = new EmbedBuilder()
          .setTitle("伺服器設置")
          .setColor(0x3498db)
          .setDescription(`以下是 **${interaction.guild.name}** 的當前設置：`)
          .addFields(
            { name: "語言", value: serverData.settings.language, inline: true },
            { name: "前綴", value: serverData.settings.prefix, inline: true },
            {
              name: "歡迎頻道",
              value: serverData.settings.welcomeChannel ? `<#${serverData.settings.welcomeChannel}>` : "未設置",
              inline: true,
            },
            {
              name: "歡迎訊息",
              value: serverData.settings.welcomeMessage || "未設置",
              inline: false,
            },
            {
              name: "日誌頻道",
              value: serverData.settings.logChannel ? `<#${serverData.settings.logChannel}>` : "未設置",
              inline: true,
            },
          )
          .setFooter({ text: `伺服器 ID: ${serverId}` })
          .setTimestamp()

        await interaction.reply({ embeds: [embed] })
        break

      case "language":
        // 設置語言
        const language = interaction.options.getString("language")

        // 更新伺服器設置
        database.updateServerSettings(serverId, { language })

        await interaction.reply(`伺服器語言已設置為: ${language}`)
        break

      case "welcome":
        // 設置歡迎訊息
        const welcomeChannel = interaction.options.getChannel("channel").id
        const welcomeMessage = interaction.options.getString("message")

        // 更新伺服器設置
        database.updateServerSettings(serverId, {
          welcomeChannel,
          welcomeMessage,
        })

        await interaction.reply(`歡迎訊息已設置為在 <#${welcomeChannel}> 頻道顯示:\n${welcomeMessage}`)
        break

      case "log":
        // 設置日誌頻道
        const logChannel = interaction.options.getChannel("channel").id

        // 更新伺服器設置
        database.updateServerSettings(serverId, { logChannel })

        await interaction.reply(`日誌頻道已設置為: <#${logChannel}>`)
        break

      default:
        await interaction.reply("未知的子命令")
    }
  },
}

