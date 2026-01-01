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
  
    // Pass through mid position (75-110°) when going down (extending)
    if (angle > 75 && angle < 110 && stage === "down") {
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
    if (angle > 100 && stage === "up") {
      stage = "down"
      passedMid = false
    }
  
    return { count, stage, passedMid }
  }
  