import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export interface Word {
  id: number
  word: string
  weight: number
  category: string
}

export interface VoiceHistory {
  id: number
  voice_text: string
  optimized_text: string | null
  duration: number
  language: string
  mode: string
  created_at: Date
}

export interface SystemConfig {
  config_key: string
  config_value: string
}

const DB_CONFIG = {
  host: '8.152.220.158',
  port: 3306,
  user: 'root',
  password: 'Byj2005*',
  database: 'voice_input',
  waitForConnections: true,
  connectionLimit: 5,
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS user_words (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(255) NOT NULL UNIQUE COMMENT '热词',
    weight INT DEFAULT 50 COMMENT '权重0-100',
    category VARCHAR(100) DEFAULT '' COMMENT '分类',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='用户自定义热词';

CREATE TABLE IF NOT EXISTS voice_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    voice_text TEXT NOT NULL COMMENT '原始识别文本',
    optimized_text TEXT COMMENT 'AI纠错后文本',
    duration INT DEFAULT 0 COMMENT '录音时长秒',
    language VARCHAR(20) DEFAULT 'zh' COMMENT '语种',
    mode VARCHAR(50) DEFAULT 'general' COMMENT '输入模式',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at)
) COMMENT='语音识别历史';

CREATE TABLE IF NOT EXISTS system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT NOT NULL COMMENT '配置值',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='系统配置';

INSERT IGNORE INTO system_config (config_key, config_value) VALUES
('shortcut_key', 'Alt+V'),
('language', 'zh'),
('mode', 'general');
`

export async function initDatabase(): Promise<void> {
  // First connect without database to create it
  const tempConn = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
  })
  await tempConn.execute('CREATE DATABASE IF NOT EXISTS voice_input DEFAULT CHARACTER SET utf8mb4')
  await tempConn.end()

  pool = mysql.createPool(DB_CONFIG)

  // Run schema
  const conn = await pool.getConnection()
  try {
    for (const sql of SCHEMA_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0)) {
      await conn.execute(sql)
    }
  } finally {
    conn.release()
  }
}

export async function getConfig(key: string): Promise<string | null> {
  if (!pool) throw new Error('Database not initialized')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT config_value FROM system_config WHERE config_key = ?', [key]
  )
  return rows.length > 0 ? rows[0].config_value : null
}

export async function setConfig(key: string, value: string): Promise<void> {
  if (!pool) throw new Error('Database not initialized')
  await pool.execute(
    'INSERT INTO system_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
    [key, value, value]
  )
}

export async function insertHistory(
  voiceText: string, optimizedText: string | null, duration: number, language: string, mode: string
): Promise<number> {
  if (!pool) throw new Error('Database not initialized')
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    'INSERT INTO voice_history (voice_text, optimized_text, duration, language, mode) VALUES (?, ?, ?, ?, ?)',
    [voiceText, optimizedText, duration, language, mode]
  )
  return result.insertId
}

export async function getHistory(limit = 50, offset = 0): Promise<VoiceHistory[]> {
  if (!pool) throw new Error('Database not initialized')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT * FROM voice_history ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]
  )
  return rows as VoiceHistory[]
}

export async function searchHistory(keyword: string): Promise<VoiceHistory[]> {
  if (!pool) throw new Error('Database not initialized')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT * FROM voice_history WHERE voice_text LIKE ? OR optimized_text LIKE ? ORDER BY created_at DESC',
    [`%${keyword}%`, `%${keyword}%`]
  )
  return rows as VoiceHistory[]
}

export async function getWords(): Promise<Word[]> {
  if (!pool) throw new Error('Database not initialized')
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT * FROM user_words ORDER BY weight DESC'
  )
  return rows as Word[]
}

export async function addWord(word: string, weight = 50, category = ''): Promise<void> {
  if (!pool) throw new Error('Database not initialized')
  await pool.execute(
    'INSERT INTO user_words (word, weight, category) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE weight = VALUES(weight)',
    [word, weight, category]
  )
}

export async function deleteWord(id: number): Promise<void> {
  if (!pool) throw new Error('Database not initialized')
  await pool.execute('DELETE FROM user_words WHERE id = ?', [id])
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}
