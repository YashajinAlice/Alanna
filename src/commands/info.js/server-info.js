const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const i18n = require("../../i18n")

module.exports = {
  data: new SlashCommandBuilder().setName("server-info").setDescription("顯示伺服器信息"),
  category: "info",
  execute: async (interaction) => {
    const { guild } = interaction

    // Get verification level
    const verificationLevels = {
      0: i18n.t("SERVER_INFO_COMMAND.VERIFICATION_LEVELS.0"),
      1: i18n.t("SERVER_INFO_COMMAND.VERIFICATION_LEVELS.1"),
      2: i18n.t("SERVER_INFO_COMMAND.VERIFICATION_LEVELS.2"),
      3: i18n.t("SERVER_INFO_COMMAND.VERIFICATION_LEVELS.3"),
      4: i18n.t("SERVER_INFO_COMMAND.VERIFICATION_LEVELS.4"),
    }

    // Get boost tier
    const boostTier = {
      0: i18n.t("SERVER_INFO_COMMAND.BOOST_TIERS.0"),
      1: i18n.t("SERVER_INFO_COMMAND.BOOST_TIERS.1"),
      2: i18n.t("SERVER_INFO_COMMAND.BOOST_TIERS.2"),
      3: i18n.t("SERVER_INFO_COMMAND.BOOST_TIERS.3"),
    }

    const embed = new EmbedBuilder()
      .setTitle(i18n.t("SERVER_INFO_COMMAND.TITLE", undefined, { server_name: guild.name }))
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor(0x3498db)
      .addFields(
        { name: i18n.t("SERVER_INFO_COMMAND.SERVER_NAME"), value: guild.name, inline: true },
        { name: i18n.t("SERVER_INFO_COMMAND.SERVER_ID"), value: guild.id, inline: true },
        { name: i18n.t("SERVER_INFO_COMMAND.OWNER"), value: `<@${guild.ownerId}>`, inline: true },
        {
          name: i18n.t("SERVER_INFO_COMMAND.CREATED"),
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        { name: i18n.t("SERVER_INFO_COMMAND.MEMBERS"), value: `${guild.memberCount}`, inline: true },
        { name: i18n.t("SERVER_INFO_COMMAND.BOOST_LEVEL"), value: boostTier[guild.premiumTier], inline: true },
        {
          name: i18n.t("SERVER_INFO_COMMAND.BOOST_COUNT"),
          value: `${guild.premiumSubscriptionCount || 0}`,
          inline: true,
        },
        {
          name: i18n.t("SERVER_INFO_COMMAND.VERIFICATION_LEVEL"),
          value: verificationLevels[guild.verificationLevel],
          inline: true,
        },
        { name: i18n.t("SERVER_INFO_COMMAND.CHANNELS"), value: `${guild.channels.cache.size}`, inline: true },
        { name: i18n.t("SERVER_INFO_COMMAND.ROLES"), value: `${guild.roles.cache.size}`, inline: true },
        { name: i18n.t("SERVER_INFO_COMMAND.EMOJIS"), value: `${guild.emojis.cache.size}`, inline: true },
        { name: i18n.t("SERVER_INFO_COMMAND.STICKERS"), value: `${guild.stickers?.cache.size || 0}`, inline: true },
      )

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 4096 }))
    }

    await interaction.reply({ embeds: [embed] })
  },
}

