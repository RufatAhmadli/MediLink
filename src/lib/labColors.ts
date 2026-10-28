// Fixed colour per lab so the same lab looks the same on every chart.
const LAB_COLORS: Record<string, string> = {
  'lab-nur': '#0B7A6F',
  'lab-caspian': '#2F5DD1',
  'lab-merkez': '#9A3FC9',
}

export const labColor = (labId: string) => LAB_COLORS[labId] ?? '#5A6B84'
