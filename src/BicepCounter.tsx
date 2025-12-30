import { useEffect, useRef, useState } from "react"
import { pose } from "./components/pose"
import { calculateAngle } from "./components/angle"
import { smooth } from "./components/smooth"
import { updateCounter } from "./components/counter"
import { useTimer } from "./components/timer"
import Webcam from "./webcam"
import { saveScore } from "./utils/leaderboard"
import { cropFaceFromVideo } from "./utils/faceCapture"
import Leaderboard from "./Leaderboard"

let leftPrev = 160
let rightPrev = 160

export default function BicepCounter() {
  const [leftCount, setLeftCount] = useState(0)
  const [rightCount, setRightCount] = useState(0)
  const { timeLeft, reset: resetTimer, start: startTimer } = useTimer(60, true) // Use the timer hook
  const [isPoseReady, setIsPoseReady] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  
  // Reset saved score flag when component mounts or timer resets
  useEffect(() => {
    hasSavedScoreRef.current = false
    setShowLeaderboard(false)
  }, [])
  
  // Handle Play Again - reset everything
  const handlePlayAgain = () => {
    // Reset all game state
    setLeftCount(0)
    setRightCount(0)
    leftCountRef.current = 0
    rightCountRef.current = 0
    leftStageRef.current = "down"
    rightStageRef.current = "down"
    leftMidRef.current = false
    rightMidRef.current = false
    hasSavedScoreRef.current = false
    lastPoseLandmarksRef.current = null
    isProcessingRef.current = false
    
    // Reset timer
    resetTimer(60)
    startTimer()
    
    // Hide leaderboard
    setShowLeaderboard(false)
    
    // Reset pose ready state
    setIsPoseReady(false)
    setTimeout(() => {
      setIsPoseReady(true)
    }, 500)
  }
  
  const leftStageRef = useRef<"up" | "down">("down")
  const rightStageRef = useRef<"up" | "down">("down")
  const leftMidRef = useRef(false)
  const rightMidRef = useRef(false)
  const leftCountRef = useRef(0)
  const rightCountRef = useRef(0)
  const isProcessingRef = useRef(false)
  const lastFrameTimeRef = useRef(0)
  const timeLeftRef = useRef(timeLeft)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastPoseLandmarksRef = useRef<any[] | null>(null)
  const hasSavedScoreRef = useRef(false)
  const FRAME_THROTTLE_MS = 60 // ~30fps instead of 60fps

  useEffect(() => {
    leftCountRef.current = leftCount
    rightCountRef.current = rightCount
  }, [leftCount, rightCount])

  // Keep timeLeft ref updated
  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  // Initialize MediaPipe and wait for it to be ready
  useEffect(() => {
    // Wait longer for MediaPipe to fully initialize and load all assets
    const initTimer = setTimeout(() => {
      setIsPoseReady(true)
      console.log("MediaPipe Pose is ready - starting frame processing")
    }, 3000) // Give MediaPipe 3 seconds to load assets and avoid SIMD issues

    return () => clearTimeout(initTimer)
  }, [])



  // Capture face when timer reaches 1 second (before camera stops)
  useEffect(() => {
    if (timeLeft === 1 && !hasSavedScoreRef.current) {
      // Capture face 1 second before timer ends to ensure video is still active
      if (videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA) {
        const totalScore = leftCountRef.current + rightCountRef.current
        
        console.log("FaceCapture: Capturing face at 1 second remaining...")
        console.log("FaceCapture: Video readyState:", videoRef.current.readyState)
        console.log("FaceCapture: Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight)
        console.log("FaceCapture: Has pose landmarks:", !!lastPoseLandmarksRef.current)
        
        const faceImage = cropFaceFromVideo(videoRef.current, lastPoseLandmarksRef.current || undefined)
        
        if (faceImage) {
          saveScore(totalScore, faceImage)
          console.log("Score saved with real face image:", totalScore, "Image length:", faceImage.length)
          hasSavedScoreRef.current = true
        } else {
          console.warn("Face capture failed at 1 second, will retry at 0")
        }
      }
    }
  }, [timeLeft])

  // Stop processing when timer reaches 0 and show leaderboard
  useEffect(() => {
    if (timeLeft === 0) {
      isProcessingRef.current = false // Stop any pending processing
      
      // If face wasn't captured at 1 second, try one more time
      if (!hasSavedScoreRef.current && videoRef.current) {
        const totalScore = leftCountRef.current + rightCountRef.current
        
        console.log("FaceCapture: Final attempt to capture face at 0 seconds...")
        const faceImage = cropFaceFromVideo(videoRef.current, lastPoseLandmarksRef.current || undefined)
        
        if (faceImage) {
          saveScore(totalScore, faceImage)
          console.log("Score saved with real face image:", totalScore)
        } else {
          // Save score with placeholder if capture still fails
          console.warn("Face capture failed, using placeholder")
          const placeholderImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+"
          saveScore(totalScore, placeholderImage)
          console.log("Score saved with placeholder image:", totalScore)
        }
        hasSavedScoreRef.current = true
      }
      
      // Show leaderboard after a short delay
      setTimeout(() => {
        setShowLeaderboard(true)
      }, 500)
    }
  }, [timeLeft])

  useEffect(() => {
    pose.onResults((results: any) => {
      // Stop detection when timer reaches 0 (use ref to get current value)
      if (timeLeftRef.current === 0) {
        return
      }

      if (!results.poseLandmarks) {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) {
          console.log("Waiting for pose detection...")
        }
        return
      }
      
      console.log("Pose detected! Processing landmarks...")
      // Reset processing flag when results are received
      isProcessingRef.current = false
      
      console.log("pose results have landmarks:", !!results.poseLandmarks)
      if (!results.poseLandmarks) return

      const lm = results.poseLandmarks
      
      // Store last pose landmarks for face cropping
      lastPoseLandmarksRef.current = lm

      const ls = [lm[11].x, lm[11].y]
      const le = [lm[13].x, lm[13].y]
      const lw = [lm[15].x, lm[15].y]

      const rs = [lm[12].x, lm[12].y]
      const re = [lm[14].x, lm[14].y]
      const rw = [lm[16].x, lm[16].y]

      const leftRaw = calculateAngle(ls, le, lw)
      const rightRaw = calculateAngle(rs, re, rw)

      const leftAngle = smooth(leftRaw, leftPrev)
      const rightAngle = smooth(rightRaw, rightPrev)

      leftPrev = leftAngle
      rightPrev = rightAngle

      const l = updateCounter(leftAngle, leftStageRef.current, leftCountRef.current, leftMidRef.current)
      setLeftCount(l.count)
      leftStageRef.current = l.stage
      leftMidRef.current = l.passedMid

      const r = updateCounter(rightAngle, rightStageRef.current, rightCountRef.current, rightMidRef.current)
      setRightCount(r.count)
      rightStageRef.current = r.stage
      rightMidRef.current = r.passedMid

      console.log("LEFT:", l.count, "RIGHT:", r.count)
    })
  }, [])
//html video element from webcam.tsx
  const handleFrame = (video: HTMLVideoElement) => {
    // Store video reference for face capture
    videoRef.current = video
    // Stop detection when timer reaches 0 (use ref to get current value)
    if (timeLeftRef.current === 0) {
      return
    }

    // Only send frames if MediaPipe is ready and video has valid dimensions
    if (!isPoseReady) return
    
    // Check if video has valid dimensions (not 0x0)
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    // Check if video is actually playing and has data
    if (video.readyState < video.HAVE_ENOUGH_DATA) {
      return
    }

    // Throttle frame processing to avoid overwhelming MediaPipe
    const now = performance.now()
    if (now - lastFrameTimeRef.current < FRAME_THROTTLE_MS) {
      return
    }

    // Don't send a new frame if MediaPipe is still processing the previous one
    if (isProcessingRef.current) {
      return
    }

    try {
      isProcessingRef.current = true
      lastFrameTimeRef.current = now
      // Send video directly to MediaPipe - simple and clean
      pose.send({ image: video })
      
      // Safety timeout: reset processing flag after 1 second if no results received
      // This prevents getting stuck if MediaPipe fails silently
      setTimeout(() => {
        if (isProcessingRef.current) {
          console.warn("MediaPipe processing timeout - resetting flag")
          isProcessingRef.current = false
        }
      }, 1000)
    } catch (error) {
      // Log errors to help debug - but don't spam
      if (error instanceof Error && !error.message.includes('memory access')) {
        console.error('MediaPipe send error:', error.message)
      }
      // Reset processing flag on error
      isProcessingRef.current = false
      console.error("Error sending frame to MediaPipe:", error)
    }
  }

  // Show leaderboard when timer reaches 0
  if (showLeaderboard) {
    return <Leaderboard onPlayAgain={handlePlayAgain} />
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Webcam onFrame={handleFrame} stopCamera={timeLeft === 0} />
      
      {/* Left Count - Top Left */}
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        color: 'black', 
        fontSize: '24px',
        fontWeight: 'bold',
        zIndex: 10,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '5px' }}>LEFT BICEP</div>
        <div style={{ fontSize: '48px' }}>{leftCount}</div>
      </div>

      {/* Timer - Top Center */}
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'black', 
        fontSize: '24px',
        fontWeight: 'bold',
        zIndex: 10,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '5px' }}>TIMER</div>
        <div style={{ fontSize: '48px' }}>{timeLeft}</div>
      </div>

      {/* Right Count - Top Right */}
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        right: 20, 
        color: 'black', 
        fontSize: '24px',
        fontWeight: 'bold',
        zIndex: 10,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '5px' }}>RIGHT BICEP</div>
        <div style={{ fontSize: '48px' }}>{rightCount}</div>
      </div>
    </div>
  )
}
