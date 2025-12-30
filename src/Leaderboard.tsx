import { useEffect, useState } from "react"
import { getLeaderboard, clearLeaderboard, type LeaderboardEntry } from "./utils/leaderboard"

export default function Leaderboard() {
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

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the leaderboard?")) {
      clearLeaderboard()
      setEntries([])
    }
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#000',
      color: '#fff',
      padding: '40px 20px',
      overflowY: 'auto',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '48px',
          marginBottom: '40px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          🏆 LEADERBOARD 🏆
        </h1>

        {entries.length === 0 ? (
          <div style={{
            textAlign: 'center',
            fontSize: '24px',
            marginTop: '100px',
            color: '#888'
          }}>
            No scores yet. Play the game to see your ranking!
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {entries.map((entry, index) => (
              <div
                key={`${entry.timestamp}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: index === 0 
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' 
                    : index === 1
                    ? 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)'
                    : index === 2
                    ? 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'
                    : 'linear-gradient(135deg, #333 0%, #222 100%)',
                  padding: '20px',
                  borderRadius: '15px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  border: index < 3 ? '3px solid #fff' : '1px solid #555'
                }}
              >
                {/* Rank */}
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  minWidth: '80px',
                  textAlign: 'center',
                  color: index < 3 ? '#000' : '#fff',
                  textShadow: index < 3 ? 'none' : '2px 2px 4px rgba(0,0,0,0.5)'
                }}>
                  #{index + 1}
                </div>

                {/* Player Image */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 20px',
                  border: '3px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  flexShrink: 0
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

                {/* Score */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: index < 3 ? '#000' : '#fff',
                    textShadow: index < 3 ? 'none' : '2px 2px 4px rgba(0,0,0,0.5)'
                  }}>
                    {entry.score} reps
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: index < 3 ? '#333' : '#aaa',
                    marginTop: '5px'
                  }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Medal for top 3 */}
                {index < 3 && (
                  <div style={{
                    fontSize: '40px',
                    marginLeft: '10px'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '40px'
          }}>
            <button
              onClick={handleClear}
              style={{
                padding: '12px 24px',
                fontSize: '18px',
                background: '#d32f2f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#b71c1c'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#d32f2f'
              }}
            >
              Clear Leaderboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
