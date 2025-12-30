export type LeaderboardEntry = {
  score: number
  playerImage: string // base64 encoded image
  timestamp: number
}

const STORAGE_KEY = "bicep_leaderboard"
const MAX_ENTRIES = 6

/**
 * Get all leaderboard entries from localStorage
 */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error("Error loading leaderboard:", error)
    return []
  }
}

/**
 * Save a new score to leaderboard
 * Maintains only top 6 scores
 */
export function saveScore(score: number, playerImage: string): void {
  const entries = getLeaderboard()
  
  // Add new entry
  const newEntry: LeaderboardEntry = {
    score,
    playerImage,
    timestamp: Date.now()
  }
  
  entries.push(newEntry)
  
  // Sort by score (descending), then by timestamp (newer first for same score)
  entries.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }
    return b.timestamp - a.timestamp
  })
  
  // Keep only top 6
  const topEntries = entries.slice(0, MAX_ENTRIES)
  
  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topEntries))
  } catch (error) {
    console.error("Error saving leaderboard:", error)
  }
}

/**
 * Clear all leaderboard entries
 */
export function clearLeaderboard(): void {
  localStorage.removeItem(STORAGE_KEY)
}

