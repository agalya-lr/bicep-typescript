import { useEffect, useRef } from "react"

export default function Webcam({ 
  onFrame, 
  stopCamera = false 
}: { 
  onFrame: (frame: HTMLVideoElement) => void
  stopCamera?: boolean 
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const requestRef = useRef<number | undefined>(undefined)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        streamRef.current = stream
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  // Stop camera when stopCamera prop becomes true
  useEffect(() => {
    if (stopCamera && streamRef.current) {
      // Stop frame processing
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = undefined
      }
      
      // Stop camera stream
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      
      // Clear video source
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.pause()
      }
    }
  }, [stopCamera])

  useEffect(() => {
    // Don't start processing if camera is stopped
    if (stopCamera) {
      return
    }

    const processFrame = () => {
      // Stop processing if camera was stopped
      if (stopCamera) {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current)
          requestRef.current = undefined
        }
        return
      }

      if (videoRef.current) {
        // Only send frame if video has valid dimensions and is ready
        const video = videoRef.current
        if (
          video.readyState >= video.HAVE_ENOUGH_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          onFrame(video) //passes html video element to the onFrame function  
        }
      }
      requestRef.current = requestAnimationFrame(processFrame)
    }
    
    // Start processing after a short delay to ensure video is initialized
    const startTimer = setTimeout(() => {
      if (videoRef.current && !stopCamera) {
        requestRef.current = requestAnimationFrame(processFrame)
      }
    }, 500)

    return () => {
      clearTimeout(startTimer)
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [onFrame, stopCamera])

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
