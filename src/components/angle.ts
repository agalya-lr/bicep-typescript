export function calculateAngle(
    a: number[],
    b: number[],
    c: number[]
  ): number {
    const dx1 = c[0] - b[0]
    const dy1 = c[1] - b[1]
    const dx2 = a[0] - b[0]
    const dy2 = a[1] - b[1]
  
    let angle =
      Math.abs(
        (Math.atan2(dy1, dx1) - Math.atan2(dy2, dx2)) * (180 / Math.PI)
      )
  
    if (angle > 180) angle = 360 - angle
    return angle
  }
  