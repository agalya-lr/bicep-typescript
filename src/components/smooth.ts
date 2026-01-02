export function smooth(value: number, prev: number, alpha = 0.5) {
    return alpha * value + (1 - alpha) * prev
  }
  //removes noise from the angle
  //alpha is the smoothing factor (0.5 = faster response, better for fast movements)