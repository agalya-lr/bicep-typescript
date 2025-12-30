/**
 * Crop face region from video using pose landmarks
 * Uses nose and eye landmarks to estimate face position
 */
export function cropFaceFromVideo(
  video: HTMLVideoElement,
  poseLandmarks?: any[]
): string | null {
  try {
    // Check if video is ready - allow HAVE_CURRENT_DATA or higher
    if (!video) {
      console.warn("FaceCapture: Video element is null")
      return null
    }
    
    // Try to capture even if readyState is low, but log it
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      console.warn("FaceCapture: Video readyState is low:", video.readyState, "but attempting capture anyway")
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn("FaceCapture: Could not get canvas context")
      return null
    }

    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    if (videoWidth === 0 || videoHeight === 0) {
      console.warn("FaceCapture: Video has invalid dimensions:", videoWidth, videoHeight)
      return null
    }

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
        console.log("FaceCapture: Landmarks exist but nose/eyes not detected, using center-top fallback")
        cropWidth = Math.min(300, videoWidth * 0.4)
        cropHeight = cropWidth
        cropX = Math.max(0, (videoWidth - cropWidth) / 2)
        cropY = Math.max(0, videoHeight * 0.1)
      }
    } else {
      // Fallback: use center-top region if no landmarks
      console.log("FaceCapture: No pose landmarks available, using center-top fallback")
      cropWidth = Math.min(300, videoWidth * 0.4)
      cropHeight = cropWidth
      cropX = Math.max(0, (videoWidth - cropWidth) / 2)
      cropY = Math.max(0, videoHeight * 0.1)
    }
    
    // Ensure we always have valid dimensions (final fallback)
    if (cropWidth <= 0 || cropHeight <= 0) {
      console.warn("FaceCapture: Crop dimensions invalid, using default")
      cropWidth = Math.min(250, videoWidth * 0.35)
      cropHeight = cropWidth
      cropX = Math.max(0, (videoWidth - cropWidth) / 2)
      cropY = Math.max(0, videoHeight * 0.15)
    }

    // Set canvas size to crop dimensions
    canvas.width = cropWidth
    canvas.height = cropHeight

    // Validate crop dimensions before drawing
    if (cropWidth <= 0 || cropHeight <= 0) {
      console.warn("FaceCapture: Invalid crop dimensions:", cropWidth, cropHeight)
      return null
    }

    // Draw cropped region to canvas
    try {
      ctx.drawImage(
        video,
        cropX, cropY, cropWidth, cropHeight, // Source region
        0, 0, cropWidth, cropHeight // Destination region
      )
    } catch (drawError) {
      console.error("FaceCapture: Error drawing image to canvas:", drawError)
      return null
    }

    // Convert to base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.8)
    
    if (!base64Image || base64Image.length === 0) {
      console.warn("FaceCapture: Failed to generate base64 image")
      return null
    }

    console.log("FaceCapture: Successfully captured face image, size:", base64Image.length, "chars")
    return base64Image
  } catch (error) {
    console.error("FaceCapture: Error cropping face:", error)
    return null
  }
}

