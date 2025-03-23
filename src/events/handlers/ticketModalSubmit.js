const { Events, EmbedBuilder } = require("discord.js")
const database = require("../../utils/database")
const logger = require("../../utils/logger")

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    // 只處理模態表單提交，且只處理票口關閉模態表單
    if (!interaction.isModalSubmit() || interaction.customId !== "close_ticket_modal") return

    try {
      // 獲取關閉原因
      const reason = interaction.fields.getTextInputValue("close_reason") || "未提供原因"

      // 先回覆互動，避免超時
      await interaction.reply(`此票口正在關閉中... ${reason !== "未提供原因" ? `原因: ${reason}` : ""}`)

      const serverId = interaction.guild.id
      const serverData = database.getServer(serverId)

      // 檢查當前頻道是否為票口
      const channelId = interaction.channel.id
      const ticketData = Object.values(serverData.tickets?.activeTickets || {}).find(
        (ticket) => ticket.channelId === channelId,
      )

      if (!ticketData) {
        return // 如果不是票口，直接返回，因為我們已經回覆了互動
      }

      // 創建票口記錄
      if (serverData.tickets.transcriptChannel) {
        const transcriptChannel = interaction.guild.channels.cache.get(serverData.tickets.transcriptChannel)

        if (transcriptChannel) {
          try {
            // 獲取票口中的所有訊息
            const messages = await interaction.channel.messages.fetch({ limit: 100 })
            const transcript = messages
              .reverse()
              .map((m) => {
                return `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`
              })
              .join("\n")

            const transcriptEmbed = new EmbedBuilder()
              .setTitle(`票口記錄 #${ticketData.number}`)
              .setDescription(`創建者: <@${ticketData.creatorId}>\n關閉者: ${interaction.user}\n關閉原因: ${reason}`)
              .setColor(0xe74c3c)
              .setFooter({ text: `票口ID: ${ticketData.id}` })
              .setTimestamp()

            // 發送記錄
            await transcriptChannel.send({
              embeds: [transcriptEmbed],
              files: [
                {
                  attachment: Buffer.from(transcript),
                  name: `ticket-${ticketData.number}.txt`,
                },
              ],
            })
          } catch (error) {
            logger.error(`無法發送票口記錄: ${error}`)
            // 繼續執行，不中斷關閉流程
          }
        }
      }

      // 發送DM通知
      if (serverData.tickets.dmNotifications) {
        try {
          const creator = await interaction.client.users.fetch(ticketData.creatorId)
          const dmEmbed = new EmbedBuilder()
            .setTitle(`您的票口已關閉`)
            .setDescription(
              `您在 ${interaction.guild.name} 的票口 #${ticketData.number} 已被 ${interaction.user.tag} 關閉。\n\n${reason !== "未提供原因" ? `原因: ${reason}` : ""}`,
            )
            .setColor(0xe74c3c)
            .setTimestamp()

          await creator.send({ embeds: [dmEmbed] })
        } catch (error) {
          logger.error(`無法發送DM給票口創建者: ${error}`)
          // 繼續執行，不中斷關閉流程
        }
      }

      // 從活動票口中移除
      delete serverData.tickets.activeTickets[ticketData.id]
      database.saveServer(interaction.guild.id)

      // 延遲5秒後刪除頻道
      setTimeout(async () => {
        try {
          await interaction.channel.delete(`票口關閉 - ${reason}`)
        } catch (error) {
          logger.error(`無法刪除票口頻道: ${error}`)
        }
      }, 5000)
    } catch (error) {
      logger.error(`處理關閉票口模態表單時發生錯誤: ${error}`)

      // 確保我們只在尚未回覆時嘗試回覆
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: "關閉票口時發生錯誤。請稍後再試或使用 `/tickets close` 命令。",
            ephemeral: true,
          })
        } catch (replyError) {
          logger.error(`嘗試回覆互動時發生錯誤: ${replyError}`)
        }
      }
    }
  },
}

