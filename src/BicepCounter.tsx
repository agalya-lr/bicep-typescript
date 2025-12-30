import { useEffect, useRef, useState } from "react"
import { pose } from "./components/pose"
import { calculateAngle } from "./components/angle"
import { smooth } from "./components/smooth"
import { updateCounter } from "./components/counter"
import { useTimer } from "./components/timer"
import Webcam from "./webcam"

let leftPrev = 160
let rightPrev = 160

export default function BicepCounter() {
  const [leftCount, setLeftCount] = useState(0)
  const [rightCount, setRightCount] = useState(0)
  const { timeLeft } = useTimer(60, true) // Use the timer hook
  const [isPoseReady, setIsPoseReady] = useState(false)
  
  const leftStageRef = useRef<"up" | "down">("down")
  const rightStageRef = useRef<"up" | "down">("down")
  const leftMidRef = useRef(false)
  const rightMidRef = useRef(false)
  const leftCountRef = useRef(0)
  const rightCountRef = useRef(0)

  useEffect(() => {
    leftCountRef.current = leftCount
    rightCountRef.current = rightCount
  }, [leftCount, rightCount])

  // Initialize MediaPipe and wait for it to be ready
  useEffect(() => {
    // Wait longer for MediaPipe to fully initialize and load all assets
    const initTimer = setTimeout(() => {
      setIsPoseReady(true)
      console.log("MediaPipe Pose is ready - starting frame processing")
    }, 3000) // Give MediaPipe 3 seconds to load assets and avoid SIMD issues

    return () => clearTimeout(initTimer)
  }, [])



  useEffect(() => {
    pose.onResults((results: any) => {
      if (!results.poseLandmarks) {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) {
          console.log("⏳ Waiting for pose detection...")
        }
        return
      }
      
      console.log("✅ Pose detected! Processing landmarks...")

      const lm = results.poseLandmarks

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

    try {
      // Send video directly to MediaPipe - simple and clean
      pose.send({ image: video })
    } catch (error) {
      // Log errors to help debug - but don't spam
      if (error instanceof Error && !error.message.includes('memory access')) {
        console.error('MediaPipe send error:', error.message)
      }
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Webcam onFrame={handleFrame} />
      
      {/* Left Count - Top Left */}
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        color: 'white', 
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
        color: 'white', 
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
        color: 'white', 
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
