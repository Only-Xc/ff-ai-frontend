export const DEFAULT_CHART_HEIGHT = 320

interface ChartColorToken {
  colorPrimary: string
  colorSuccess: string
  colorWarning: string
  colorInfo: string
  colorError: string
}

export function getChartColors(
  token: ChartColorToken,
  options: { includeError?: boolean } = {},
): string[] {
  const colors = [
    token.colorPrimary,
    token.colorSuccess,
    token.colorWarning,
    token.colorInfo,
  ]

  return options.includeError ? [...colors, token.colorError] : colors
}
