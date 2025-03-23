const { SlashCommandBuilder, EmbedBuilder, version: discordJsVersion } = require("discord.js")
const { version, version2 } = require("../../../package.json")
const fs = require("fs")
const path = require("path")
const os = require("os")
const i18n = require("../../i18n")

module.exports = {
  data: new SlashCommandBuilder().setName("bot-info").setDescription("顯示機器人資訊和近期更新"),
  category: "info",
  execute: async (interaction) => {
    // 獲取機器人啟動時間
    const uptime = formatUptime(interaction.client.uptime)
    
    // 獲取系統資訊
    const osInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
      nodeVersion: process.version,
    }
    
    // 獲取更新記錄
    const updateLog = getUpdateLog()
    
    // 創建嵌入訊息
    const embed = new EmbedBuilder()
      .setTitle(`${interaction.client.user.username} 機器人資訊`)
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
      .setColor(0x3498db)
      .addFields(
        { name: "版本", value: `${version} (${version2})`, inline: true },
        { name: "Discord.js", value: `v${discordJsVersion}`, inline: true },
        { name: "Node.js", value: osInfo.nodeVersion, inline: true },
        { name: "運行時間", value: uptime, inline: true },
        { name: "伺服器數量", value: `${interaction.client.guilds.cache.size}`, inline: true },
        { name: "用戶數量", value: `${interaction.client.users.cache.size}`, inline: true },
        { name: "系統", value: `${osInfo.platform} (${osInfo.arch})`, inline: true },
        { name: "CPU", value: `${osInfo.cpus} 核心`, inline: true },
        { name: "記憶體", value: osInfo.memory, inline: true },
        { name: "指令數量", value: `${interaction.client.commands.size}`, inline: true },
        { name: "語言", value: `${Object.keys(i18n.languages).join(", ")}`, inline: true },
        { name: "開發者", value: "芙檁", inline: true },
        { name: "支援Wiki", value: "[點我](https://vsgm9gsdom9o.sg.larksuite.com/wiki/Klg5wIWA6isTL6kHEMMlnH5OgIf?from=from_copylink)", inline: true }
      )
      .setFooter({ text: `ID: ${interaction.client.user.id} • 創建於 ${interaction.client.user.createdAt.toLocaleDateString()}` })
      .setTimestamp()
    
    // 添加更新記錄
    if (updateLog) {
      embed.addFields({ name: "近期更新", value: updateLog })
    }
    
    await interaction.reply({ embeds: [embed] })
  },
}

// 格式化運行時間
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  return `${days}天 ${hours % 24}小時 ${minutes % 60}分鐘 ${seconds % 60}秒`
}

// 獲取更新記錄
function getUpdateLog() {
  try {
    const updateLogPath = path.join(__dirname, "../../docs/update-log.md")
    if (fs.existsSync(updateLogPath)) {
      const updateLog = fs.readFileSync(updateLogPath, "utf8")
      // 只返回最近的更新（前1000個字符）
      return updateLog.slice(0, 1000) + (updateLog.length > 1000 ? "..." : "")
    }
    return "暫無更新記錄"
  } catch (error) {
    console.error("無法讀取更新記錄:", error)
    return "無法讀取更新記錄"
  }
}
