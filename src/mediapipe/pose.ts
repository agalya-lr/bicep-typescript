import { Pose } from "@mediapipe/pose"

// Load MediaPipe Pose assets (WASM, .data, etc.) from the local
// public/mediapipe/pose folder. Also force the non-SIMD build
// to avoid SIMD-related WASM runtime errors.
export const pose = new Pose({
  locateFile: (file) => {
    // If MediaPipe requests the SIMD variant (e.g.
    // pose_solution_simd_wasm_bin.wasm), redirect to the
    // non-SIMD file (pose_solution_wasm_bin.wasm).
    const nonSimdFile = file.replace("simd_", "")
    return `/mediapipe/pose/${nonSimdFile}`
  },
})



pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
})



