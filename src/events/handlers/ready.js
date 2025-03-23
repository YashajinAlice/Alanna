const { Events, ActivityType } = require("discord.js");
const logger = require("../../utils/logger");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);

    // 定義遊戲名稱陣列
    const games = [
      "/help",
      "Ver0.0.0.14",
      "全由芙檁維護開發",
      "WiKi待上架",
    ];

    // 每 5 秒更新遊戲名稱
    let index = 0;
    setInterval(() => {
      const game = games[index];
      client.user.setActivity(game, { type: ActivityType.Playing });
      index = (index + 1) % games.length; // 循環播放遊戲名稱
    }, 5000); // 5000 毫秒 = 5 秒
  },
};