const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const database = require("../../utils/database")

module.exports = {
  data: new SlashCommandBuilder().setName("stats").setDescription("顯示伺服器統計信息"),
  category: "info",
  execute: async (interaction) => {
    const serverId = interaction.guild.id

    // 獲取伺服器數據
    const serverData = database.getServer(serverId)

    // 更新成員數量
    serverData.stats.memberCount = interaction.guild.memberCount
    database.saveServer(serverId)

    // 獲取最常用的命令
    const commandsUsed = serverData.stats.commandsUsed
    const sortedCommands = Object.entries(commandsUsed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd, count], index) => `${index + 1}. \`/${cmd}\` - ${count} 次`)

    // 創建嵌入訊息
    const embed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name} 的統計信息`)
      .setColor(0x3498db)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "成員數量", value: `${serverData.stats.memberCount}`, inline: true },
        { name: "訊息數量", value: `${serverData.stats.messageCount || 0}`, inline: true },
        { name: "命令使用次數", value: `${Object.values(commandsUsed).reduce((a, b) => a + b, 0) || 0}`, inline: true },
      )
      .setFooter({ text: `伺服器 ID: ${serverId}` })
      .setTimestamp()

    // 添加最常用命令
    if (sortedCommands.length > 0) {
      embed.addFields({ name: "最常用的命令", value: sortedCommands.join("\n") })
    } else {
      embed.addFields({ name: "最常用的命令", value: "尚無數據" })
    }

    await interaction.reply({ embeds: [embed] })
  },
}

