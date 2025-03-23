const fs = require("fs")
const path = require("path")

class I18n {
  constructor() {
    this.languages = {}
    this.defaultLanguage = "zh-TW"
    this.loadLanguages()
  }

  loadLanguages() {
    const languagesPath = path.join(__dirname, "locales")
    if (!fs.existsSync(languagesPath)) {
      fs.mkdirSync(languagesPath, { recursive: true })
      // Create default Chinese locale file if it doesn't exist
      const defaultLocale = {
        PING_COMMAND: {
          RESPONSE: "嗶嗶！",
        },
        GENERAL: {
          ERROR: "發生錯誤！",
          SUCCESS: "操作成功完成！",
        },
      }
      fs.writeFileSync(path.join(languagesPath, "zh-TW.json"), JSON.stringify(defaultLocale, null, 2))
    }

    const localeFiles = fs.readdirSync(languagesPath).filter((file) => file.endsWith(".json"))

    for (const file of localeFiles) {
      const localeName = file.split(".")[0]
      const localePath = path.join(languagesPath, file)
      const localeData = require(localePath)
      this.languages[localeName] = localeData
    }
  }

  t(key, language = this.defaultLanguage, replacements = {}) {
    // If language doesn't exist, fall back to default
    if (!this.languages[language]) {
      language = this.defaultLanguage
    }

    // Split the key by dots to navigate nested objects
    const keyParts = key.split(".")
    let translation = this.languages[language]

    // Navigate through the nested objects
    for (const part of keyParts) {
      if (translation && translation[part]) {
        translation = translation[part]
      } else {
        // Key not found, return the key itself
        return key
      }
    }

    // Handle replacements
    if (typeof translation === "string" && Object.keys(replacements).length > 0) {
      for (const [key, value] of Object.entries(replacements)) {
        translation = translation.replace(new RegExp(`{${key}}`, "g"), value)
      }
    }

    return translation
  }

  setDefaultLanguage(language) {
    if (this.languages[language]) {
      this.defaultLanguage = language
      return true
    }
    return false
  }

  getAvailableLanguages() {
    return Object.keys(this.languages)
  }
}

module.exports = new I18n()

