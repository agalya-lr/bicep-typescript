import { useEffect, useState } from "react"
import { getLeaderboard, type LeaderboardEntry } from "./utils/leaderboard"

type LeaderboardProps = {
  onPlayAgain?: () => void
}

export default function Leaderboard({ onPlayAgain }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    // Load leaderboard on mount
    setEntries(getLeaderboard())
    
    // Listen for storage changes to update leaderboard in real-time
    const handleStorageChange = () => {
      setEntries(getLeaderboard())
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically (in case same-tab updates)
    const interval = setInterval(() => {
      setEntries(getLeaderboard())
    }, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Helper function to get rank suffix
  const getRankSuffix = (index: number): string => {
    const rank = index + 1
    if (rank === 1) return '1st'
    if (rank === 2) return '2nd'
    if (rank === 3) return '3rd'
    return `${rank}th`
  }

  // Ensure we have exactly 6 entries (pad with empty if needed)
  const displayEntries: (LeaderboardEntry | null)[] = [...entries]
  while (displayEntries.length < 6) {
    displayEntries.push(null)
  }
  const top6Entries = displayEntries.slice(0, 6)

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: '40px 20px',
      overflowY: 'auto',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Title */}
        <h1 style={{
          textAlign: 'center',
          fontSize: '48px',
          marginBottom: '60px',
          color: '#fff',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          Bicep Leaderboard
        </h1>

        {/* Grid Layout - 2 rows, 3 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '30px',
          width: '100%',
          maxWidth: '900px',
          marginBottom: '60px'
        }}>
          {top6Entries.map((entry, index) => (
            <div
              key={entry ? `${entry.timestamp}-${index}` : `empty-${index}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                background: entry ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                backdropFilter: 'blur(10px)',
                border: entry ? '2px solid rgba(255, 255, 255, 0.2)' : '2px dashed rgba(255, 255, 255, 0.1)',
                minHeight: '200px'
              }}
            >
              {entry ? (
                <>
                  {/* Player Image */}
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    marginBottom: '15px',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    background: '#fff'
                  }}>
                    <img
                      src={entry.playerImage}
                      alt={`Player ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Rank */}
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#8B5CF6', // Purple color
                    // marginBottom: '8px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {getRankSuffix(index)}
                  </div>

                  {/* Score */}
                  <div style={{
                    fontSize: '20px',
                    color: '#fff',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    Score: {entry.score}
                  </div>
                </>
              ) : (
                <div style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textAlign: 'center'
                }}>
                  No Score
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Play Again Button */}
        <button
          onClick={onPlayAgain}
          style={{
            padding: '15px 40px',
            fontSize: '20px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            minWidth: '200px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f0f0f0'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#fff'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
