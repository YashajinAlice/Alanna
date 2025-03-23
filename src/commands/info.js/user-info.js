const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const i18n = require("../../i18n")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("user-info")
    .setDescription("顯示用戶信息")
    .addUserOption((option) => option.setName("user").setDescription("要顯示信息的用戶").setRequired(false)),
  category: "info",
  execute: async (interaction) => {
    const targetUser = interaction.options.getUser("user") || interaction.user
    const member = interaction.guild.members.cache.get(targetUser.id)

    const embed = new EmbedBuilder()
      .setTitle(i18n.t("USER_INFO_COMMAND.TITLE", undefined, { username: targetUser.username }))
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setColor(member?.displayColor || 0x3498db)
      .addFields(
        { name: i18n.t("USER_INFO_COMMAND.USERNAME"), value: targetUser.username, inline: true },
        { name: i18n.t("USER_INFO_COMMAND.USER_ID"), value: targetUser.id, inline: true },
        {
          name: i18n.t("USER_INFO_COMMAND.ACCOUNT_CREATED"),
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
          inline: false,
        },
      )

    if (member) {
      embed.addFields(
        {
          name: i18n.t("USER_INFO_COMMAND.JOINED_SERVER"),
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
          inline: false,
        },
        {
          name: i18n.t("USER_INFO_COMMAND.NICKNAME"),
          value: member.nickname || i18n.t("USER_INFO_COMMAND.NONE"),
          inline: true,
        },
        {
          name: i18n.t("USER_INFO_COMMAND.ROLES"),
          value:
            member.roles.cache.size > 1
              ? member.roles.cache
                  .filter((r) => r.id !== interaction.guild.id)
                  .map((r) => `<@&${r.id}>`)
                  .join(", ")
              : i18n.t("USER_INFO_COMMAND.NONE"),
          inline: false,
        },
      )
    }

    await interaction.reply({ embeds: [embed] })
  },
}

