const { SlashCommandBuilder } = require("discord.js")
const i18n = require("../../i18n")

module.exports = {
  data: new SlashCommandBuilder().setName("modal-example").setDescription("顯示範例表單"),
  category: "utility",
  execute: async (interaction) => {
    // Get the modal from the client's modals collection
    const modal = interaction.client.modals.get("example-modal")

    if (!modal) {
      return interaction.reply({
        content: i18n.t("GENERAL.ERROR"),
        ephemeral: true,
      })
    }

    // Show the modal to the user
    await interaction.showModal(modal.create())
  },
}

