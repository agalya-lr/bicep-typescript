import { useRef } from "react"
import { pose } from "./components/pose"
import { calculateAngle } from "./components/angle"
import { smooth } from "./components/smooth"
import { updateCounter } from "./components/counter"

type LeaderboardEntry = {
  score: number
  time: number
}

export default function BicepCounter() {
  const leftCountRef = useRef(0)
  const rightCountRef = useRef(0)

  const leftStageRef = useRef<"up" | "down">("down")
  const rightStageRef = useRef<"up" | "down">("down")

  const leftMidRef = useRef(false)
  const rightMidRef = useRef(false)

  const leftPrevRef = useRef(160)
  const rightPrevRef = useRef(160)

  pose.onResults((results) => {
    if (!results.poseLandmarks) return

    const lm = results.poseLandmarks

    const leftRaw = calculateAngle(
      [lm[11].x, lm[11].y],
      [lm[13].x, lm[13].y],
      [lm[15].x, lm[15].y]
    )

    const rightRaw = calculateAngle(
      [lm[12].x, lm[12].y],
      [lm[14].x, lm[14].y],
      [lm[16].x, lm[16].y]
    )

    const leftAngle = smooth(leftRaw, leftPrevRef.current)
    const rightAngle = smooth(rightRaw, rightPrevRef.current)

    leftPrevRef.current = leftAngle
    rightPrevRef.current = rightAngle

    const l = updateCounter(
      leftAngle,
      leftStageRef.current,
      leftCountRef.current,
      leftMidRef.current
    )

    leftCountRef.current = l.count
    leftStageRef.current = l.stage
    leftMidRef.current = l.passedMid

    const r = updateCounter(
      rightAngle,
      rightStageRef.current,
      rightCountRef.current,
      rightMidRef.current
    )

    rightCountRef.current = r.count
    rightStageRef.current = r.stage
    rightMidRef.current = r.passedMid
  })

  // SAVE SCORE (example)
  const saveScore = () => {
    const score = leftCountRef.current + rightCountRef.current

    const leaderboard: LeaderboardEntry[] = JSON.parse(
      localStorage.getItem("scores") || "[]"
    )

    leaderboard.push({ score, time: Date.now() })
    leaderboard.sort((a, b) => b.score - a.score)

    localStorage.setItem("scores", JSON.stringify(leaderboard.slice(0, 6)))
  }

  return (
    <div>
      <button onClick={saveScore}>Save Score</button>
    </div>
  )
}
