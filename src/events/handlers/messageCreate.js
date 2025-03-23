const { Events } = require("discord.js")
const database = require("../../utils/database")
const logger = require("../../utils/logger")

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    // 忽略機器人訊息
    if (message.author.bot) return

    // 只處理伺服器訊息
    if (!message.guild) return

    try {
      // 獲取伺服器數據
      const serverId = message.guild.id
      const serverData = database.getServer(serverId)

      // 更新訊息計數
      if (!serverData.stats.messageCount) {
        serverData.stats.messageCount = 0
      }

      serverData.stats.messageCount++
      database.saveServer(serverId)

      // 檢查是否設置了日誌頻道
      if (serverData.settings.logChannel) {
        // 這裡可以添加更詳細的日誌記錄邏輯
        // 例如記錄刪除的訊息、編輯的訊息等
      }

      // 更新用戶最後活動時間
      const userData = database.getUser(message.author.id)
      userData.stats.lastSeen = new Date().toISOString()
      database.saveUser(message.author.id)
    } catch (error) {
      logger.error(`Error handling message create event: ${error.message}`)
    }
  },
}

