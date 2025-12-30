import { Pose } from "@mediapipe/pose"

// Use LOCAL files from public/mediapipe/pose - more reliable than CDN
// CRITICAL: Force non-SIMD build to avoid "memory access out of bounds" errors
export const pose = new Pose({
  locateFile: (file) => {
    // Aggressively redirect SIMD files to non-SIMD equivalents
    let nonSimdFile = file
    
    // Remove all SIMD references from filename
    if (file.toLowerCase().includes('simd')) {
      nonSimdFile = file.replace(/simd_/gi, '')
      nonSimdFile = nonSimdFile.replace(/_simd/gi, '')
      nonSimdFile = nonSimdFile.replace(/simd/gi, '')
      
      // Log the redirect for debugging
      if (file.includes('.wasm') || file.includes('.js')) {
        console.log(`Redirecting SIMD file: "${file}" → "${nonSimdFile}"`)
      }
    }
    
    return `/mediapipe/pose/${nonSimdFile}`
  },
})

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
})