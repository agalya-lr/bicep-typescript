import { Pose } from "@mediapipe/pose"

// Use CDN with pinned version - clean, simple setup
export const pose = new Pose({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
})

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
})



