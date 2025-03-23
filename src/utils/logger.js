const fs = require("fs")
const path = require("path")

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, "..", "..", "logs")
    this.ensureLogsDirectory()
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true })
    }
  }

  formatDate() {
    const date = new Date()
    return date.toISOString()
  }

  formatLogEntry(level, message) {
    return `[${this.formatDate()}] [${level.toUpperCase()}] ${message}\n`
  }

  log(level, message) {
    const logEntry = this.formatLogEntry(level, message)

    // Log to console
    console.log(logEntry)

    // Log to file
    const today = new Date().toISOString().split("T")[0]
    const logFile = path.join(this.logsDir, `${today}.log`)

    fs.appendFileSync(logFile, logEntry)
  }

  info(message) {
    this.log("info", message)
  }

  warn(message) {
    this.log("warn", message)
  }

  error(message) {
    this.log("error", message)
  }

  debug(message) {
    this.log("debug", message)
  }
}

module.exports = new Logger()

