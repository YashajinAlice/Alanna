const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '..', '..', 'data');
    this.serversDir = path.join(this.dataDir, 'servers');
    this.usersDir = path.join(this.dataDir, 'users');
    this.globalFile = path.join(this.dataDir, 'global.json');
    
    this.ensureDirectories();
    this.cache = {
      servers: new Map(),
      users: new Map(),
      global: this.loadGlobalData()
    };
  }

  // 確保所有必要的目錄存在
  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.serversDir)) {
      fs.mkdirSync(this.serversDir, { recursive: true });
    }
    if (!fs.existsSync(this.usersDir)) {
      fs.mkdirSync(this.usersDir, { recursive: true });
    }
    
    // 確保全局數據文件存在
    if (!fs.existsSync(this.globalFile)) {
      fs.writeFileSync(this.globalFile, JSON.stringify({
        createdAt: new Date().toISOString(),
        settings: {
          defaultLanguage: 'zh-TW',
          defaultPrefix: '!'
        }
      }, null, 2));
    }
  }

  // 加載全局數據
  loadGlobalData() {
    try {
      const data = fs.readFileSync(this.globalFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error loading global data: ${error.message}`);
      return {
        createdAt: new Date().toISOString(),
        settings: {
          defaultLanguage: 'zh-TW',
          defaultPrefix: '!'
        }
      };
    }
  }

  // 保存全局數據
  saveGlobalData() {
    try {
      fs.writeFileSync(this.globalFile, JSON.stringify(this.cache.global, null, 2));
      return true;
    } catch (error) {
      logger.error(`Error saving global data: ${error.message}`);
      return false;
    }
  }

  // 獲取伺服器數據
  getServer(serverId) {
    // 如果緩存中有數據，直接返回
    if (this.cache.servers.has(serverId)) {
      return this.cache.servers.get(serverId);
    }

    // 否則從文件加載
    const serverFile = path.join(this.serversDir, `${serverId}.json`);
    
    if (fs.existsSync(serverFile)) {
      try {
        const data = fs.readFileSync(serverFile, 'utf8');
        const serverData = JSON.parse(data);
        this.cache.servers.set(serverId, serverData);
        return serverData;
      } catch (error) {
        logger.error(`Error loading server data for ${serverId}: ${error.message}`);
      }
    }

    // 如果沒有數據或加載失敗，創建默認數據
    const defaultServerData = {
      id: serverId,
      createdAt: new Date().toISOString(),
      settings: {
        language: this.cache.global.settings.defaultLanguage,
        prefix: this.cache.global.settings.defaultPrefix,
        welcomeChannel: null,
        welcomeMessage: "歡迎 {user} 加入伺服器！",
        logChannel: null,
        moderationRoles: [],
        autoRoles: []
      },
      customCommands: [],
      stats: {
        memberCount: 0,
        messageCount: 0,
        commandsUsed: {}
      },
      tickets: {
        enabled: false,
        category: null,
        supportRoles: [],
        dmNotifications: false,
        transcriptChannel: null,
        counter: 0,
        activeTickets: {}
      }
    };

    this.cache.servers.set(serverId, defaultServerData);
    this.saveServer(serverId);
    return defaultServerData;
  }

  // 保存伺服器數據
  saveServer(serverId) {
    if (!this.cache.servers.has(serverId)) {
      logger.warn(`Attempted to save non-existent server data for ${serverId}`);
      return false;
    }

    const serverFile = path.join(this.serversDir, `${serverId}.json`);
    const serverData = this.cache.servers.get(serverId);

    try {
      fs.writeFileSync(serverFile, JSON.stringify(serverData, null, 2));
      return true;
    } catch (error) {
      logger.error(`Error saving server data for ${serverId}: ${error.message}`);
      return false;
    }
  }

  // 更新伺服器設置
  updateServerSettings(serverId, settings) {
    const serverData = this.getServer(serverId);
    serverData.settings = { ...serverData.settings, ...settings };
    this.cache.servers.set(serverId, serverData);
    return this.saveServer(serverId);
  }

  // 獲取用戶數據
  getUser(userId) {
    // 如果緩存中有數據，直接返回
    if (this.cache.users.has(userId)) {
      return this.cache.users.get(userId);
    }

    // 否則從文件加載
    const userFile = path.join(this.usersDir, `${userId}.json`);
    
    if (fs.existsSync(userFile)) {
      try {
        const data = fs.readFileSync(userFile, 'utf8');
        const userData = JSON.parse(data);
        this.cache.users.set(userId, userData);
        return userData;
      } catch (error) {
        logger.error(`Error loading user data for ${userId}: ${error.message}`);
      }
    }

    // 如果沒有數據或加載失敗，創建默認數據
    const defaultUserData = {
      id: userId,
      createdAt: new Date().toISOString(),
      settings: {
        language: this.cache.global.settings.defaultLanguage
      },
      stats: {
        commandsUsed: {},
        lastSeen: new Date().toISOString()
      }
    };

    this.cache.users.set(userId, defaultUserData);
    this.saveUser(userId);
    return defaultUserData;
  }

  // 保存用戶數據
  saveUser(userId) {
    if (!this.cache.users.has(userId)) {
      logger.warn(`Attempted to save non-existent user data for ${userId}`);
      return false;
    }

    const userFile = path.join(this.usersDir, `${userId}.json`);
    const userData = this.cache.users.get(userId);

    try {
      fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
      return true;
    } catch (error) {
      logger.error(`Error saving user data for ${userId}: ${error.message}`);
      return false;
    }
  }

  // 更新用戶設置
  updateUserSettings(userId, settings) {
    const userData = this.getUser(userId);
    userData.settings = { ...userData.settings, ...settings };
    this.cache.users.set(userId, userData);
    return this.saveUser(userId);
  }

  // 記錄命令使用
  logCommandUsage(serverId, userId, commandName) {
    // 更新伺服器統計
    const serverData = this.getServer(serverId);
    if (!serverData.stats.commandsUsed[commandName]) {
      serverData.stats.commandsUsed[commandName] = 0;
    }
    serverData.stats.commandsUsed[commandName]++;
    this.cache.servers.set(serverId, serverData);
    this.saveServer(serverId);

    // 更新用戶統計
    const userData = this.getUser(userId);
    if (!userData.stats.commandsUsed[commandName]) {
      userData.stats.commandsUsed[commandName] = 0;
    }
    userData.stats.commandsUsed[commandName]++;
    userData.stats.lastSeen = new Date().toISOString();
    this.cache.users.set(userId, userData);
    this.saveUser(userId);
  }

  // 獲取所有伺服器ID
  getAllServerIds() {
    try {
      const files = fs.readdirSync(this.serversDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      logger.error(`Error getting all server IDs: ${error.message}`);
      return [];
    }
  }

  // 獲取所有用戶ID
  getAllUserIds() {
    try {
      const files = fs.readdirSync(this.usersDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      logger.error(`Error getting all user IDs: ${error.message}`);
      return [];
    }
  }

  // 清除緩存
  clearCache() {
    this.cache.servers.clear();
    this.cache.users.clear();
    this.cache.global = this.loadGlobalData();
  }
}

module.exports = new Database();
