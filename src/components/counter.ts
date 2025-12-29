export function updateCounter(
    angle: number,
    stage: "up" | "down",
    count: number,
    passedMid: boolean
  ) {
    if (angle > 150) {
      stage = "down"
      passedMid = false
    }
  
    if (angle > 75 && angle < 110 && stage === "down") {
      passedMid = true
    }
  
    if (angle < 60 && stage === "down" && passedMid) {
      count += 1
      stage = "up"
      passedMid = false
    }
  
    return { count, stage, passedMid }
  }
  