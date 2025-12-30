export type LeaderboardEntry = {
  score: number
  playerImage: string // base64 encoded image
  timestamp: number
}

const STORAGE_PREFIX = "bicep_leaderboard_"
const STORAGE_INDEX_KEY = "bicep_leaderboard_index"
const MAX_ENTRIES = 6

/**
 * Get all leaderboard entries from localStorage (stored as key-value pairs)
 */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    // Get the index array that stores the order of entries
    const indexStr = localStorage.getItem(STORAGE_INDEX_KEY)
    if (!indexStr) return []
    
    const indices: number[] = JSON.parse(indexStr)
    const entries: LeaderboardEntry[] = []
    
    // Retrieve each entry using its key
    for (const index of indices) {
      const key = `${STORAGE_PREFIX}${index}`
      const entryStr = localStorage.getItem(key)
      if (entryStr) {
        try {
          const entry: LeaderboardEntry = JSON.parse(entryStr)
          entries.push(entry)
        } catch (error) {
          console.error(`Error parsing entry at key ${key}:`, error)
        }
      }
    }
    
    return entries
  } catch (error) {
    console.error("Error loading leaderboard:", error)
    return []
  }
}

/**
 * Save a new score to leaderboard
 * Stores each entry as a separate key-value pair in localStorage
 * Maintains only top 6 scores
 */
export function saveScore(score: number, playerImage: string): void {
  try {
    // Get existing entries
    const entries = getLeaderboard()
    
    // Add new entry
    const newEntry: LeaderboardEntry = {
      score,
      playerImage, // base64 encoded image string
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
    
    // Clear old entries from localStorage
    clearLeaderboard()
    
    // Store each entry as a separate key-value pair
    const indices: number[] = []
    topEntries.forEach((entry) => {
      const key = `${STORAGE_PREFIX}${entry.timestamp}` // Use timestamp as unique key
      indices.push(entry.timestamp)
      
      // Store entry as JSON string (base64 image is already a string, so it's preserved)
      localStorage.setItem(key, JSON.stringify(entry))
    })
    
    // Store the index array to maintain order
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(indices))
    
    console.log(`Saved ${topEntries.length} entries as key-value pairs in localStorage`)
  } catch (error) {
    console.error("Error saving leaderboard:", error)
    
    // Fallback: if storage fails (e.g., quota exceeded), try to save without images
    if (error instanceof DOMException && error.code === 22) {
      console.warn("localStorage quota exceeded, attempting to save without images...")
      try {
        const entries = getLeaderboard()
        entries.push({
          score,
          playerImage: "", // Empty image if storage is full
          timestamp: Date.now()
        })
        entries.sort((a, b) => b.score - a.score)
        const topEntries = entries.slice(0, MAX_ENTRIES)
        
        const indices: number[] = []
        topEntries.forEach((entry) => {
          const key = `${STORAGE_PREFIX}${entry.timestamp}`
          indices.push(entry.timestamp)
          localStorage.setItem(key, JSON.stringify(entry))
        })
        localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(indices))
      } catch (fallbackError) {
        console.error("Fallback save also failed:", fallbackError)
      }
    }
  }
}

/**
 * Clear all leaderboard entries
 */
export function clearLeaderboard(): void {
  try {
    // Get all keys and remove them
    const indexStr = localStorage.getItem(STORAGE_INDEX_KEY)
    if (indexStr) {
      const indices: number[] = JSON.parse(indexStr)
      indices.forEach((index) => {
        const key = `${STORAGE_PREFIX}${index}`
        localStorage.removeItem(key)
      })
    }
    localStorage.removeItem(STORAGE_INDEX_KEY)
  } catch (error) {
    console.error("Error clearing leaderboard:", error)
    // Fallback: remove all keys with the prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    }
    localStorage.removeItem(STORAGE_INDEX_KEY)
  }
}
