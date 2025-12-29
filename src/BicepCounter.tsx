import { useEffect, useRef, useState } from "react"
import { pose } from "./mediapipe/pose"
import { calculateAngle } from "./components/angle"
import { smooth } from "./components/smooth"
import { updateCounter } from "./components/counter"
import Webcam from "./webcam"

let leftPrev = 160
let rightPrev = 160

export default function BicepCounter() {
  const [leftCount, setLeftCount] = useState(0)
  const [rightCount, setRightCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
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

  // Timer countdown from 60
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    pose.onResults((results: any) => {
      console.log("pose results have landmarks:", !!results.poseLandmarks)
      if (!results.poseLandmarks) return

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
      // Silently catch errors to prevent console spam
      // MediaPipe will retry on next frame
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
