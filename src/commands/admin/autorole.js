const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js")
const database = require("../../utils/database")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("管理自動分配給新成員的角色")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("添加自動角色")
        .addRoleOption((option) => option.setName("role").setDescription("選擇要自動分配的角色").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("移除自動角色")
        .addRoleOption((option) => option.setName("role").setDescription("選擇要移除的自動角色").setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName("list").setDescription("列出所有自動角色")),
  category: "admin",
  execute: async (interaction) => {
    const serverId = interaction.guild.id
    const subcommand = interaction.options.getSubcommand()

    // 獲取伺服器設置
    const serverData = database.getServer(serverId)

    // 確保 autoRoles 數組存在
    if (!serverData.settings.autoRoles) {
      serverData.settings.autoRoles = []
    }

    // 處理不同的子命令
    switch (subcommand) {
      case "add":
        // 添加自動角色
        const roleToAdd = interaction.options.getRole("role")

        // 檢查機器人是否有權限分配該角色
        const botMember = interaction.guild.members.cache.get(interaction.client.user.id)
        if (roleToAdd.position >= botMember.roles.highest.position) {
          return interaction.reply({
            content: `我沒有權限分配 ${roleToAdd.name} 角色，因為它的位置高於或等於我的最高角色。`,
            ephemeral: true,
          })
        }

        // 檢查角色是否已經在列表中
        if (serverData.settings.autoRoles.includes(roleToAdd.id)) {
          return interaction.reply({
            content: `${roleToAdd.name} 已經是自動角色了。`,
            ephemeral: true,
          })
        }

        // 添加角色到自動角色列表
        serverData.settings.autoRoles.push(roleToAdd.id)
        database.saveServer(serverId)

        await interaction.reply(`已將 ${roleToAdd.name} 添加為自動角色。新成員加入時將自動獲得此角色。`)
        break

      case "remove":
        // 移除自動角色
        const roleToRemove = interaction.options.getRole("role")

        // 檢查角色是否在列表中
        const roleIndex = serverData.settings.autoRoles.indexOf(roleToRemove.id)
        if (roleIndex === -1) {
          return interaction.reply({
            content: `${roleToRemove.name} 不是自動角色。`,
            ephemeral: true,
          })
        }

        // 從自動角色列表中移除角色
        serverData.settings.autoRoles.splice(roleIndex, 1)
        database.saveServer(serverId)

        await interaction.reply(`已將 ${roleToRemove.name} 從自動角色列表中移除。`)
        break

      case "list":
        // 列出所有自動角色
        if (serverData.settings.autoRoles.length === 0) {
          return interaction.reply("目前沒有設置任何自動角色。")
        }

        const rolesList = serverData.settings.autoRoles
          .map((roleId) => {
            const role = interaction.guild.roles.cache.get(roleId)
            return role ? `<@&${roleId}>` : `未知角色 (${roleId})`
          })
          .join("\n")

        const embed = new EmbedBuilder()
          .setTitle("自動角色列表")
          .setDescription("以下角色將自動分配給新加入的成員：")
          .addFields({ name: "角色", value: rolesList })
          .setColor(0x3498db)
          .setFooter({ text: `伺服器: ${interaction.guild.name}` })
          .setTimestamp()

        await interaction.reply({ embeds: [embed] })
        break

      default:
        await interaction.reply("未知的子命令")
    }
  },
}

