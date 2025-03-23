const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js")
const i18n = require("../i18n")

module.exports = {
  id: "example-modal",

  // Create the modal
  create: () => {
    const modal = new ModalBuilder().setCustomId("example-modal").setTitle(i18n.t("MODAL_EXAMPLE.TITLE"))

    // Add components to modal
    const favoriteColorInput = new TextInputBuilder()
      .setCustomId("favoriteColorInput")
      .setLabel(i18n.t("MODAL_EXAMPLE.COLOR_LABEL"))
      .setStyle(TextInputStyle.Short)

    const hobbiesInput = new TextInputBuilder()
      .setCustomId("hobbiesInput")
      .setLabel(i18n.t("MODAL_EXAMPLE.HOBBIES_LABEL"))
      .setStyle(TextInputStyle.Paragraph)

    // Add inputs to the modal
    const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput)
    const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput)

    // Add action rows to the modal
    modal.addComponents(firstActionRow, secondActionRow)

    return modal
  },

  // Handle the modal submission
  execute: async (interaction) => {
    const favoriteColor = interaction.fields.getTextInputValue("favoriteColorInput")
    const hobbies = interaction.fields.getTextInputValue("hobbiesInput")

    await interaction.reply({
      content: i18n.t("MODAL_EXAMPLE.RESPONSE", undefined, { color: favoriteColor, hobbies: hobbies }),
      ephemeral: true,
    })
  },
}

