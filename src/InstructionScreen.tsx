import { useEffect, useState } from "react"

type InstructionScreenProps = {
  onComplete: () => void
}

export default function InstructionScreen({ onComplete }: InstructionScreenProps) {
  const [currentPoster, setCurrentPoster] = useState<'welcome' | 'instructions'>('welcome')
  const [showPoster, setShowPoster] = useState(true)

  useEffect(() => {
    // Initialize camera in the background during poster display to avoid delay
    console.log("Initializing camera in background during instruction display...")
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 720 },
        height: { ideal: 1280 },
        facingMode: 'user'
      } 
    })
      .then(stream => {
        console.log("Camera initialized successfully during instruction display")
        // Stop the stream - we just needed to get permission
        // Webcam component will request its own stream when it mounts
        stream.getTracks().forEach(track => track.stop())
      })
      .catch(err => {
        console.error("Error accessing webcam during initialization:", err)
        // Continue anyway - Webcam component will retry
      })

    // Show welcome poster for 5 seconds
    const welcomeTimer = setTimeout(() => {
      setShowPoster(false)
      
      // Brief fade transition
      setTimeout(() => {
        setCurrentPoster('instructions')
        setShowPoster(true)
      }, 300)
    }, 5000)

    // Show instructions poster for 5 seconds, then complete
    const instructionsTimer = setTimeout(() => {
      setShowPoster(false)
      
      // Brief fade transition before completing
      setTimeout(() => {
        onComplete()
      }, 300)
    }, 10000)

    return () => {
      clearTimeout(welcomeTimer)
      clearTimeout(instructionsTimer)
    }
  }, [onComplete])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <img
        src={`/posters/${currentPoster}.png`}
        alt={currentPoster === 'welcome' ? 'Welcome' : 'Instructions'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: showPoster ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  )
}

