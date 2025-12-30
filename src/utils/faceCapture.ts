/**
 * Crop face region from video using pose landmarks
 * Uses nose and eye landmarks to estimate face position
 */
export function cropFaceFromVideo(
  video: HTMLVideoElement,
  poseLandmarks?: any[]
): string | null {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    if (videoWidth === 0 || videoHeight === 0) return null

    let cropX = 0
    let cropY = 0
    let cropWidth = videoWidth
    let cropHeight = videoHeight

    // If we have pose landmarks, use them to estimate face position
    if (poseLandmarks && poseLandmarks.length > 0) {
      // Pose landmark indices:
      // 0: nose
      // 2: left eye inner
      // 5: right eye inner
      // 7: left ear
      // 8: right ear
      
      const nose = poseLandmarks[0]
      const leftEye = poseLandmarks[2]
      const rightEye = poseLandmarks[5]

      if (nose && leftEye && rightEye) {
        // Calculate face center and size
        const faceCenterX = nose.x * videoWidth
        const faceCenterY = nose.y * videoHeight
        
        // Estimate face width from eye distance
        const eyeDistance = Math.abs((rightEye.x - leftEye.x) * videoWidth)
        const faceSize = Math.max(eyeDistance * 2.5, 150) // Minimum 150px
        
        // Calculate crop region (square centered on face)
        cropWidth = faceSize
        cropHeight = faceSize
        cropX = Math.max(0, faceCenterX - faceSize / 2)
        cropY = Math.max(0, faceCenterY - faceSize / 2)
        
        // Ensure crop doesn't go outside video bounds
        if (cropX + cropWidth > videoWidth) {
          cropX = videoWidth - cropWidth
        }
        if (cropY + cropHeight > videoHeight) {
          cropY = videoHeight - cropHeight
        }
        
        // Ensure positive dimensions
        cropX = Math.max(0, cropX)
        cropY = Math.max(0, cropY)
        cropWidth = Math.min(cropWidth, videoWidth - cropX)
        cropHeight = Math.min(cropHeight, videoHeight - cropY)
      } else {
        // Fallback: use center-top region if landmarks not available
        cropWidth = Math.min(300, videoWidth * 0.4)
        cropHeight = cropWidth
        cropX = (videoWidth - cropWidth) / 2
        cropY = videoHeight * 0.1
      }
    } else {
      // Fallback: use center-top region if no landmarks
      cropWidth = Math.min(300, videoWidth * 0.4)
      cropHeight = cropWidth
      cropX = (videoWidth - cropWidth) / 2
      cropY = videoHeight * 0.1
    }

    // Set canvas size to crop dimensions
    canvas.width = cropWidth
    canvas.height = cropHeight

    // Draw cropped region to canvas
    ctx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight, // Source region
      0, 0, cropWidth, cropHeight // Destination region
    )

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch (error) {
    console.error("Error cropping face:", error)
    return null
  }
}

