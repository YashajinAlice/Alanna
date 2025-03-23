const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
  } = require("discord.js")
  const database = require("../../utils/database")
  const i18n = require("../../i18n")
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("tickets")
      .setDescription("管理伺服器票口系統")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand((subcommand) =>
        subcommand
          .setName("setup")
          .setDescription("設置票口系統")
          .addChannelOption((option) =>
            option.setName("channel").setDescription("選擇發送票口創建訊息的頻道").setRequired(true),
          )
          .addChannelOption((option) =>
            option
              .setName("category")
              .setDescription("選擇創建票口的類別")
              .addChannelTypes(ChannelType.GuildCategory)
              .setRequired(true),
          )
          .addRoleOption((option) =>
            option.setName("support_role").setDescription("選擇票口支援人員角色").setRequired(true),
          )
          .addStringOption((option) => option.setName("title").setDescription("設置票口訊息標題").setRequired(false))
          .addStringOption((option) =>
            option.setName("description").setDescription("設置票口訊息描述").setRequired(false),
          )
          .addStringOption((option) => option.setName("button_label").setDescription("設置按鈕文字").setRequired(false))
          .addStringOption((option) =>
            option.setName("button_emoji").setDescription("設置按鈕表情符號").setRequired(false),
          )
          .addBooleanOption((option) =>
            option.setName("dm_notifications").setDescription("是否發送DM通知").setRequired(false),
          )
          .addChannelOption((option) =>
            option.setName("transcript_channel").setDescription("選擇儲存票口記錄的頻道").setRequired(false),
          ),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("add")
          .setDescription("添加用戶或角色到當前票口")
          .addUserOption((option) => option.setName("user").setDescription("選擇要添加的用戶").setRequired(false))
          .addRoleOption((option) => option.setName("role").setDescription("選擇要添加的角色").setRequired(false)),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("remove")
          .setDescription("從當前票口移除用戶或角色")
          .addUserOption((option) => option.setName("user").setDescription("選擇要移除的用戶").setRequired(false))
          .addRoleOption((option) => option.setName("role").setDescription("選擇要移除的角色").setRequired(false)),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("close")
          .setDescription("關閉當前票口")
          .addStringOption((option) => option.setName("reason").setDescription("關閉票口的原因").setRequired(false)),
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("settings")
          .setDescription("查看或修改票口系統設置")
          .addBooleanOption((option) =>
            option.setName("dm_notifications").setDescription("是否發送DM通知").setRequired(false),
          )
          .addChannelOption((option) =>
            option.setName("transcript_channel").setDescription("選擇儲存票口記錄的頻道").setRequired(false),
          )
          .addRoleOption((option) =>
            option.setName("support_role").setDescription("選擇票口支援人員角色").setRequired(false),
          ),
      ),
    category: "admin",
    execute: async (interaction) => {
      const serverId = interaction.guild.id
      const subcommand = interaction.options.getSubcommand()
  
      // 獲取伺服器設置
      const serverData = database.getServer(serverId)
  
      // 確保 tickets 設置存在
      if (!serverData.tickets) {
        serverData.tickets = {
          enabled: false,
          category: null,
          supportRoles: [],
          dmNotifications: false,
          transcriptChannel: null,
          counter: 0,
          activeTickets: {},
        }
        database.saveServer(serverId)
      }
  
      // 處理不同的子命令
      switch (subcommand) {
        case "setup":
          await handleSetup(interaction, serverData)
          break
  
        case "add":
          await handleAddToTicket(interaction, serverData)
          break
  
        case "remove":
          await handleRemoveFromTicket(interaction, serverData)
          break
  
        case "close":
          await handleCloseTicket(interaction, serverData)
          break
  
        case "settings":
          await handleSettings(interaction, serverData)
          break
  
        default:
          await interaction.reply(i18n.t("GENERAL.UNKNOWN_SUBCOMMAND"))
      }
    },
  }
  
  // 處理設置票口系統
  async function handleSetup(interaction, serverData) {
    const channel = interaction.options.getChannel("channel")
    const category = interaction.options.getChannel("category")
    const supportRole = interaction.options.getRole("support_role")
    const title = interaction.options.getString("title") || "創建支援票口"
    const description =
      interaction.options.getString("description") ||
      "如果您需要幫助，請點擊下方按鈕創建票口，我們的工作人員會盡快回應您。"
    const buttonLabel = interaction.options.getString("button_label") || "創建票口"
    const buttonEmoji = interaction.options.getString("button_emoji") || "🎫"
    const dmNotifications = interaction.options.getBoolean("dm_notifications") ?? false
    const transcriptChannel = interaction.options.getChannel("transcript_channel")
  
    // 更新伺服器設置
    serverData.tickets.enabled = true
    serverData.tickets.category = category.id
    serverData.tickets.supportRoles = [supportRole.id]
    serverData.tickets.dmNotifications = dmNotifications
  
    if (transcriptChannel) {
      serverData.tickets.transcriptChannel = transcriptChannel.id
    }
  
    database.saveServer(interaction.guild.id)
  
    // 創建票口訊息
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0x3498db)
      .setFooter({ text: `${interaction.guild.name} • 票口系統` })
      .setTimestamp()
  
    // 添加圖片（如果有）
    if (interaction.options.getAttachment("image")) {
      embed.setImage(interaction.options.getAttachment("image").url)
    }
  
    // 創建按鈕
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ticket")
        .setLabel(buttonLabel)
        .setStyle(ButtonStyle.Primary)
        .setEmoji(buttonEmoji),
    )
  
    // 發送訊息
    await channel.send({ embeds: [embed], components: [row] })
  
    await interaction.reply({
      content: `票口系統已設置成功！訊息已發送到 ${channel}。`,
      ephemeral: true,
    })
  }
  
  // 處理添加用戶或角色到票口
  async function handleAddToTicket(interaction, serverData) {
    // 檢查當前頻道是否為票口
    const channelId = interaction.channel.id
    const ticketData = Object.values(serverData.tickets.activeTickets).find((ticket) => ticket.channelId === channelId)
  
    if (!ticketData) {
      return interaction.reply({
        content: "此命令只能在票口頻道中使用。",
        ephemeral: true,
      })
    }
  
    const user = interaction.options.getUser("user")
    const role = interaction.options.getRole("role")
  
    if (!user && !role) {
      return interaction.reply({
        content: "請指定要添加的用戶或角色。",
        ephemeral: true,
      })
    }
  
    if (user) {
      await interaction.channel.permissionOverwrites.edit(user, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      })
  
      await interaction.reply(`已將 ${user} 添加到此票口。`)
    }
  
    if (role) {
      await interaction.channel.permissionOverwrites.edit(role, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      })
  
      await interaction.reply(`已將 ${role} 角色添加到此票口。`)
    }
  }
  
  // 處理從票口移除用戶或角色
  async function handleRemoveFromTicket(interaction, serverData) {
    // 檢查當前頻道是否為票口
    const channelId = interaction.channel.id
    const ticketData = Object.values(serverData.tickets.activeTickets).find((ticket) => ticket.channelId === channelId)
  
    if (!ticketData) {
      return interaction.reply({
        content: "此命令只能在票口頻道中使用。",
        ephemeral: true,
      })
    }
  
    const user = interaction.options.getUser("user")
    const role = interaction.options.getRole("role")
  
    if (!user && !role) {
      return interaction.reply({
        content: "請指定要移除的用戶或角色。",
        ephemeral: true,
      })
    }
  
    if (user) {
      // 不允許移除票口創建者
      if (user.id === ticketData.creatorId) {
        return interaction.reply({
          content: "不能從票口中移除創建者。",
          ephemeral: true,
        })
      }
  
      await interaction.channel.permissionOverwrites.delete(user)
      await interaction.reply(`已將 ${user} 從此票口移除。`)
    }
  
    if (role) {
      // 不允許移除支援角色
      if (serverData.tickets.supportRoles.includes(role.id)) {
        return interaction.reply({
          content: "不能從票口中移除支援角色。",
          ephemeral: true,
        })
      }
  
      await interaction.channel.permissionOverwrites.delete(role)
      await interaction.reply(`已將 ${role} 角色從此票口移除。`)
    }
  }
  
  // 處理關閉票口
  async function handleCloseTicket(interaction, serverData) {
    // 檢查當前頻道是否為票口
    const channelId = interaction.channel.id
    const ticketData = Object.values(serverData.tickets.activeTickets).find((ticket) => ticket.channelId === channelId)
  
    if (!ticketData) {
      return interaction.reply({
        content: "此命令只能在票口頻道中使用。",
        ephemeral: true,
      })
    }
  
    const reason = interaction.options.getString("reason") || "未提供原因"
  
    await interaction.reply(`此票口正在關閉中... ${reason !== "未提供原因" ? `原因: ${reason}` : ""}`)
  
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
          console.error(`無法發送票口記錄: ${error}`)
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
        console.error(`無法發送DM給票口創建者: ${error}`)
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
        console.error(`無法刪除票口頻道: ${error}`)
      }
    }, 5000)
  }
  
  // 處理票口設置
  async function handleSettings(interaction, serverData) {
    const dmNotifications = interaction.options.getBoolean("dm_notifications")
    const transcriptChannel = interaction.options.getChannel("transcript_channel")
    const supportRole = interaction.options.getRole("support_role")
  
    // 如果沒有提供任何選項，顯示當前設置
    if (dmNotifications === null && !transcriptChannel && !supportRole) {
      const supportRoles = serverData.tickets.supportRoles.map((roleId) => `<@&${roleId}>`).join(", ") || "無"
      const category = serverData.tickets.category ? `<#${serverData.tickets.category}>` : "未設置"
      const transcript = serverData.tickets.transcriptChannel ? `<#${serverData.tickets.transcriptChannel}>` : "未設置"
  
      const settingsEmbed = new EmbedBuilder()
        .setTitle("票口系統設置")
        .setColor(0x3498db)
        .addFields(
          { name: "狀態", value: serverData.tickets.enabled ? "啟用" : "禁用", inline: true },
          { name: "DM通知", value: serverData.tickets.dmNotifications ? "啟用" : "禁用", inline: true },
          { name: "票口類別", value: category, inline: true },
          { name: "支援角色", value: supportRoles, inline: false },
          { name: "記錄頻道", value: transcript, inline: true },
          { name: "活動票口數量", value: Object.keys(serverData.tickets.activeTickets).length.toString(), inline: true },
        )
        .setFooter({ text: `使用 /tickets settings 修改設置` })
        .setTimestamp()
  
      return interaction.reply({ embeds: [settingsEmbed] })
    }
  
    // 更新設置
    let updated = false
    let response = "票口系統設置已更新：\n"
  
    if (dmNotifications !== null) {
      serverData.tickets.dmNotifications = dmNotifications
      response += `- DM通知: ${dmNotifications ? "啟用" : "禁用"}\n`
      updated = true
    }
  
    if (transcriptChannel) {
      serverData.tickets.transcriptChannel = transcriptChannel.id
      response += `- 記錄頻道: ${transcriptChannel}\n`
      updated = true
    }
  
    if (supportRole) {
      if (!serverData.tickets.supportRoles.includes(supportRole.id)) {
        serverData.tickets.supportRoles.push(supportRole.id)
        response += `- 已添加支援角色: ${supportRole}\n`
        updated = true
      } else {
        response += `- ${supportRole} 已經是支援角色\n`
      }
    }
  
    if (updated) {
      database.saveServer(interaction.guild.id)
      await interaction.reply(response)
    } else {
      await interaction.reply("未進行任何設置更改。")
    }
  }
  
  