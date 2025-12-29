export function smooth(value: number, prev: number, alpha = 0.2) {
    return alpha * value + (1 - alpha) * prev
  }
  