const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
    ModalBuilder,
    TextInputStyle,
    TextInputBuilder,
  } = require("discord.js")
  const database = require("../../utils/database")
  const logger = require("../../utils/logger")
  const { v4: uuidv4 } = require("uuid")
  
  module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
      // 只處理按鈕互動
      if (!interaction.isButton()) return
  
      // 處理創建票口按鈕
      if (interaction.customId === "create_ticket") {
        await handleCreateTicket(interaction)
      }
  
      // 處理關閉票口按鈕
      if (interaction.customId === "close_ticket") {
        await handleCloseTicketButton(interaction)
      }
  
      // 處理儲存對話紀錄按鈕
      if (interaction.customId === "save_transcript") {
        await handleSaveTranscript(interaction)
      }
    },
  }
  
  // 處理創建票口
  async function handleCreateTicket(interaction) {
    try {
      // 延遲回應，因為創建頻道可能需要一些時間
      await interaction.deferReply({ ephemeral: true })
  
      const serverId = interaction.guild.id
      const serverData = database.getServer(serverId)
  
      // 檢查票口系統是否啟用
      if (!serverData.tickets || !serverData.tickets.enabled) {
        return interaction.editReply("票口系統目前未啟用。")
      }
  
      // 檢查用戶是否已經有活動票口
      const existingTicket = Object.values(serverData.tickets.activeTickets || {}).find(
        (ticket) => ticket.creatorId === interaction.user.id,
      )
  
      if (existingTicket) {
        const ticketChannel = interaction.guild.channels.cache.get(existingTicket.channelId)
        if (ticketChannel) {
          return interaction.editReply(`您已經有一個活動票口: ${ticketChannel}`)
        }
      }
  
      // 獲取票口類別
      const category = interaction.guild.channels.cache.get(serverData.tickets.category)
      if (!category) {
        return interaction.editReply("票口類別不存在。請聯繫伺服器管理員。")
      }
  
      // 增加票口計數器
      if (!serverData.tickets.counter) {
        serverData.tickets.counter = 0
      }
      serverData.tickets.counter++
  
      // 創建票口ID
      const ticketId = uuidv4()
      const ticketNumber = serverData.tickets.counter
  
      // 創建票口頻道
      const channelName = `ticket-${ticketNumber}`
  
      // 設置頻道權限
      const channelPermissions = [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ]
  
      // 添加支援角色權限
      for (const roleId of serverData.tickets.supportRoles) {
        channelPermissions.push({
          id: roleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        })
      }
  
      // 創建頻道
      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: channelPermissions,
        topic: `${interaction.user.tag} 的票口 | ID: ${ticketId}`,
      })
  
      // 保存票口信息
      if (!serverData.tickets.activeTickets) {
        serverData.tickets.activeTickets = {}
      }
  
      serverData.tickets.activeTickets[ticketId] = {
        id: ticketId,
        number: ticketNumber,
        channelId: ticketChannel.id,
        creatorId: interaction.user.id,
        createdAt: new Date().toISOString(),
      }
  
      database.saveServer(serverId)
  
      // 創建票口歡迎訊息
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`票口 #${ticketNumber}`)
        .setDescription(`歡迎 ${interaction.user}！請描述您需要幫助的問題，我們的工作人員會盡快回應您。`)
        .setColor(0x3498db)
        .setFooter({ text: `票口ID: ${ticketId}` })
        .setTimestamp()
  
      // 創建票口操作按鈕
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("close_ticket").setLabel("關閉票口").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
        new ButtonBuilder()
          .setCustomId("save_transcript")
          .setLabel("儲存對話紀錄")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("📝"),
      )
  
      // 發送歡迎訊息
      await ticketChannel.send({
        content: `${interaction.user} ${serverData.tickets.supportRoles.map((r) => `<@&${r}>`).join(" ")}`,
        embeds: [welcomeEmbed],
        components: [row],
      })
  
      // 發送DM通知
      if (serverData.tickets.dmNotifications) {
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle(`票口已創建`)
            .setDescription(`您在 ${interaction.guild.name} 創建了一個票口。\n請前往 ${ticketChannel} 查看。`)
            .setColor(0x3498db)
            .setTimestamp()
  
          await interaction.user.send({ embeds: [dmEmbed] })
        } catch (error) {
          logger.warn(`無法發送DM給票口創建者: ${error}`)
        }
      }
  
      // 回覆用戶
      await interaction.editReply(`您的票口已創建: ${ticketChannel}`)
    } catch (error) {
      logger.error(`創建票口時發生錯誤: ${error}`)
      await interaction.editReply("創建票口時發生錯誤。請稍後再試或聯繫伺服器管理員。")
    }
  }
  
  // 修改關閉票口按鈕處理函數，使用模態表單
  async function handleCloseTicketButton(interaction) {
    try {
      const serverId = interaction.guild.id
      const serverData = database.getServer(serverId)
  
      // 檢查當前頻道是否為票口
      const channelId = interaction.channel.id
      const ticketData = Object.values(serverData.tickets?.activeTickets || {}).find(
        (ticket) => ticket.channelId === channelId,
      )
  
      if (!ticketData) {
        return interaction.reply({
          content: "此頻道不是有效的票口。",
          ephemeral: true,
        })
      }
  
      // 創建關閉票口的模態表單
      const modal = new ModalBuilder().setCustomId("close_ticket_modal").setTitle("關閉票口")
  
      // 添加理由輸入框
      const reasonInput = new TextInputBuilder()
        .setCustomId("close_reason")
        .setLabel("關閉原因")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("請輸入關閉此票口的原因...")
        .setRequired(false)
        .setMaxLength(1000)
  
      const firstActionRow = new ActionRowBuilder().addComponents(reasonInput)
      modal.addComponents(firstActionRow)
  
      // 顯示模態表單
      await interaction.showModal(modal)
    } catch (error) {
      logger.error(`顯示關閉票口模態表單時發生錯誤: ${error}`)
      await interaction.reply({
        content: "關閉票口時發生錯誤。請稍後再試或使用 `/tickets close` 命令。",
        ephemeral: true,
      })
    }
  }
  
  // 處理儲存對話紀錄
  async function handleSaveTranscript(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true })
  
      const serverId = interaction.guild.id
      const serverData = database.getServer(serverId)
  
      // 檢查當前頻道是否為票口
      const channelId = interaction.channel.id
      const ticketData = Object.values(serverData.tickets?.activeTickets || {}).find(
        (ticket) => ticket.channelId === channelId,
      )
  
      if (!ticketData) {
        return interaction.editReply({
          content: "此頻道不是有效的票口。",
          ephemeral: true,
        })
      }
  
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
        .setDescription(
          `伺服器: ${interaction.guild.name}\n頻道: ${interaction.channel.name}\n創建者: <@${ticketData.creatorId}>`,
        )
        .setColor(0x3498db)
        .setFooter({ text: `票口ID: ${ticketData.id}` })
        .setTimestamp()
  
      // 發送記錄到用戶DM
      try {
        await interaction.user.send({
          embeds: [transcriptEmbed],
          files: [
            {
              attachment: Buffer.from(transcript),
              name: `ticket-${ticketData.number}.txt`,
            },
          ],
        })
  
        await interaction.editReply({
          content: "票口對話記錄已發送到您的私訊。",
          ephemeral: true,
        })
      } catch (error) {
        logger.error(`無法發送DM給用戶: ${error}`)
        await interaction.editReply({
          content: "無法發送私訊。請確保您已開啟伺服器成員的私訊權限。",
          ephemeral: true,
        })
      }
    } catch (error) {
      logger.error(`儲存對話記錄時發生錯誤: ${error}`)
      await interaction.editReply({
        content: "儲存對話記錄時發生錯誤。請稍後再試。",
        ephemeral: true,
      })
    }
  }
  
  