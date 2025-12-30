import { Pose } from "@mediapipe/pose"

// Use LOCAL files from public/mediapipe/pose - more reliable than CDN
// This avoids "Aborted (Assertion failed)" errors and works offline
export const pose = new Pose({
  locateFile: (file) => `/mediapipe/pose/${file}`,
})

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8,
})



