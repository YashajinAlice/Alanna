const { SlashCommandBuilder } = require("discord.js")
const i18n = require("../../i18n")

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("檢查機器人的延遲"),
  category: "general",
  execute: async (interaction) => {
    const sent = await interaction.reply({ content: i18n.t("PING_COMMAND.RESPONSE"), fetchReply: true })
    const latency = sent.createdTimestamp - interaction.createdTimestamp

    await interaction.editReply(
      `${i18n.t("PING_COMMAND.RESPONSE")} (延遲: ${latency}ms, API延遲: ${Math.round(interaction.client.ws.ping)}ms)`,
    )
  },
}

