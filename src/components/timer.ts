import { useEffect, useRef, useState } from "react"

type UseTimerReturn = {
  timeLeft: number
  isRunning: boolean
  start: () => void
  stop: () => void
  reset: (value?: number) => void
}

// A small reusable timer hook extracted from BicepCounter logic.
export function useTimer(initial = 60, autoStart = true): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState<number>(initial)
  const [isRunning, setIsRunning] = useState<boolean>(autoStart)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isRunning) return

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const start = () => {
    if (timeLeft === 0) return
    setIsRunning(true)
  }

  const stop = () => {
    setIsRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const reset = (value = initial) => {
    stop()
    setTimeLeft(value)
  }

  return { timeLeft, isRunning, start, stop, reset }
}
