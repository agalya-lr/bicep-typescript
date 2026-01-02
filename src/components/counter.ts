export function updateCounter(
    angle: number,
    stage: "up" | "down",
    count: number,
    passedMid: boolean
  ) {
    // Reset to down position when arm is fully extended
    if (angle > 150) {
      stage = "down"
      passedMid = false
    }
  
    // Widen mid range (70-120°) to catch fast movements
    // This wider range helps catch fast curls that might skip the narrow range
    if (angle > 70 && angle < 120 && stage === "down") {
      passedMid = true
    }
  
    // For very fast curls: if arm goes from extended (>120°) directly to curled (<60°)
    // Auto-set passedMid to allow counting (catches movements too fast for mid detection)
    if (angle < 60 && stage === "down" && !passedMid && angle > 0) {
      // This is a fast curl - allow it by setting passedMid
      passedMid = true
    }
  
    // Count when reaching up position (< 60°) after passing mid
    if (angle < 60 && stage === "down" && passedMid) {
      count += 1
      stage = "up"
      passedMid = false
    }
  
    // Transition from up back to down when extending again
    // This allows continuous counting for multiple reps
    // Lowered threshold to 90° for faster detection of extension
    if (angle > 90 && stage === "up") {
      stage = "down"
      passedMid = false
    }
  
    return { count, stage, passedMid }
  }
  