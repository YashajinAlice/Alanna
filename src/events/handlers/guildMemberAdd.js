const { Events, EmbedBuilder } = require("discord.js")
const database = require("../../utils/database")
const logger = require("../../utils/logger")
const i18n = require("../../i18n")

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    try {
      // 獲取伺服器設置
      const serverId = member.guild.id
      const serverData = database.getServer(serverId)

      // 設置當前語言
      const serverLanguage = serverData.settings.language
      if (serverLanguage) {
        i18n.setDefaultLanguage(serverLanguage)
      }

      // 檢查是否設置了歡迎頻道和訊息
      if (serverData.settings.welcomeChannel && serverData.settings.welcomeMessage) {
        const welcomeChannel = member.guild.channels.cache.get(serverData.settings.welcomeChannel)

        if (welcomeChannel) {
          // 替換訊息中的變量
          const welcomeMessage = serverData.settings.welcomeMessage
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{username}/g, member.user.username)
            .replace(/{server}/g, member.guild.name)
            .replace(/{memberCount}/g, member.guild.memberCount)

          // 創建歡迎嵌入訊息
          const embed = new EmbedBuilder()
            .setTitle(i18n.t("WELCOME.TITLE", undefined, { server_name: member.guild.name }))
            .setDescription(welcomeMessage)
            .setColor(0x3498db)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({
              text: i18n.t("WELCOME.FOOTER", undefined, { member_count: member.guild.memberCount }),
            })
            .setTimestamp()

          await welcomeChannel.send({ embeds: [embed] })

          // 更新伺服器統計
          serverData.stats.memberCount = member.guild.memberCount
          database.saveServer(serverId)
        }
      }

      // 檢查是否設置了自動角色
      if (serverData.settings.autoRoles && serverData.settings.autoRoles.length > 0) {
        for (const roleId of serverData.settings.autoRoles) {
          try {
            const role = member.guild.roles.cache.get(roleId)
            if (role) {
              await member.roles.add(role)
            }
          } catch (error) {
            logger.error(`Error adding auto role ${roleId} to member ${member.id}: ${error.message}`)
          }
        }
      }
    } catch (error) {
      logger.error(`Error handling guild member add event: ${error.message}`)
    }
  },
}

