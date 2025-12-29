import { useEffect, useRef } from "react"

export default function Webcam({ onFrame }: { onFrame: (frame: HTMLVideoElement) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const requestRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      })
      .catch(err => {
        console.error("Error accessing webcam:", err)
      })

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const processFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        onFrame(videoRef.current)
      }
      requestRef.current = requestAnimationFrame(processFrame)
    }
    
    if (videoRef.current) {
      requestRef.current = requestAnimationFrame(processFrame)
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [onFrame])

  return (
    <video 
      ref={videoRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover',
        transform: 'scaleX(-1)' // Mirror the video
      }} 
      playsInline
      muted
    />
  )
}
