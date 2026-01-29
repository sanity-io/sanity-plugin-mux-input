import type {MuxOverlaySettings, WatermarkConfig} from './types'

/**
 * Converts a draggable watermark position (x, y percentages) to Mux's overlay_settings format.
 *
 * @param watermark - The watermark configuration with position, size, and opacity
 * @returns Mux overlay_settings object
 * @see {@link https://www.mux.com/docs/guides/add-watermarks-to-your-videos}
 */
export function convertWatermarkToMuxOverlay(
  watermark: WatermarkConfig,
  options?: {
    /**
     * Video aspect ratio (width / height). Needed for correct vertical positioning,
     * especially on vertical videos.
     */
    videoAspectRatio?: number
    /**
     * Unit to emit for margins/width when generating overlay_settings from Canvas mode.
     * - 'px' will generate pixel strings according to Mux's scaling rules:
     *   values are applied as if the video were scaled to 1920x1080 (horizontal)
     *   or 1080x1920 (vertical).
     * - '%' preserves existing behavior.
     */
    units?: '%' | 'px'
  }
): MuxOverlaySettings | null {
  if (!watermark.enabled || !watermark.imageUrl) {
    return null
  }

  const size = watermark.size || 20
  const opacity = watermark.opacity ?? 0.7

  /**
   * Round an existing "123.4px" style string to whole pixels, avoiding 0px.
   */
  const roundPxString = (value: string | undefined): string | undefined => {
    if (!value) return value
    const trimmed = value.trim()
    if (!trimmed.endsWith('px')) return value
    const n = Number(trimmed.slice(0, -2))
    if (!Number.isFinite(n)) return value
    let rounded = Math.round(n)
    // Avoid sending 0px (and JS -0); keep sign when user entered negative.
    if (rounded === 0) rounded = n < 0 ? -1 : 1
    return `${rounded}px`
  }

  /**
   * Convert a percentage to whole-pixel string, using Mux's base dimensions:
   * - Horizontal video: 1920x1080
   * - Vertical video:   1080x1920
   */
  const toPxString = (valuePercent: number, axis: 'x' | 'y') => {
    const videoAspectRatio = options?.videoAspectRatio ?? 16 / 9
    const isVertical = videoAspectRatio > 0 && videoAspectRatio < 1
    const baseW = isVertical ? 1080 : 1920
    const baseH = isVertical ? 1920 : 1080
    const base = axis === 'x' ? baseW : baseH
    const px = (valuePercent / 100) * base
    let rounded = Math.round(px)
    // Avoid sending 0px (and JS -0); keep sign for negative margins.
    if (rounded === 0) rounded = px < 0 ? -1 : 1
    return `${rounded}px`
  }

  const normalizeToPixels = (value: string | undefined, axis: 'x' | 'y'): string | undefined => {
    if (!value) return value
    const trimmed = value.trim()
    if (trimmed.endsWith('px')) {
      return roundPxString(trimmed)
    }
    if (trimmed.endsWith('%')) {
      const n = Number(trimmed.slice(0, -1))
      if (!Number.isFinite(n)) return value
      return toPxString(n, axis)
    }
    return value
  }

  // If user provided explicit overlay settings, use them (Mux-documented format).
  // When `options.units === 'px'`, we normalize both % and px to whole-pixel strings,
  // honoring vertical vs horizontal video bases.
  if (watermark.overlay_settings) {
    const widthValue = watermark.overlay_settings.width
    const widthNormalized =
      options?.units === 'px' ? normalizeToPixels(widthValue, 'x') : widthValue
    return {
      ...watermark.overlay_settings,
      horizontal_margin:
        options?.units === 'px'
          ? (normalizeToPixels(watermark.overlay_settings.horizontal_margin, 'x') ??
            watermark.overlay_settings.horizontal_margin)
          : watermark.overlay_settings.horizontal_margin,
      vertical_margin:
        options?.units === 'px'
          ? (normalizeToPixels(watermark.overlay_settings.vertical_margin, 'y') ??
            watermark.overlay_settings.vertical_margin)
          : watermark.overlay_settings.vertical_margin,
      width: widthNormalized ?? `${size}%`,
      opacity: watermark.overlay_settings.opacity ?? `${Math.round(opacity * 100)}%`,
    }
  }

  const position = watermark.position || {x: 50, y: 50}

  /**
   * Our UI stores watermark position as the *center point* in percentages.
   * Mux margins are interpreted relative to an *edge* (based on align).
   *
   * To make "corner" placements match what the user dragged, we convert from
   * center-position to top-left margins by subtracting half the watermark size.
   *
   * Note: `size` is a percentage of video width. Mux `width` is also expressed
   * as a percentage of the video width, so we can reuse it for horizontal math.
   * For vertical math, we approximate using the same percentage to keep behavior
   * consistent with the current draggable UI (which also uses `size` in both axes
   * for bounds).
   */
  // Allow negative margins to compensate for rounding / letterboxing edge-cases.
  // We still clamp to a sane range so values don't explode.
  const clampPercent = (value: number) => Math.max(-100, Math.min(100, value))

  // Mux accepts percentage strings; avoid sending an exact "0%" by nudging to 0.01%.
  // This also handles the JS -0 edge case and tiny floating point remnants.
  const toPercentString = (value: number) => {
    const epsilon = 1e-9
    const isZeroish = value === 0 || Object.is(value, -0) || Math.abs(value) < epsilon
    return `${isZeroish ? 0.01 : value}%`
  }

  // Watermark width is defined as % of video width (Mux `width` behaves the same).
  const watermarkWidthPercentOfVideoWidth = size

  /**
   * Convert watermark height into % of video height.
   * height% = (watermarkWidthPx / imageAspectRatio) / videoHeightPx
   *         = (size% * videoWidthPx / imageAspectRatio) / videoHeightPx
   *         = size% * (videoWidthPx/videoHeightPx) / imageAspectRatio
   *         = size% * videoAspectRatio / imageAspectRatio
   */
  const videoAspectRatio = options?.videoAspectRatio ?? 16 / 9
  const imageAspectRatio = watermark.imageAspectRatio ?? 1
  const watermarkHeightPercentOfVideoHeight = Math.max(
    0,
    Math.min(100, (size * videoAspectRatio) / imageAspectRatio)
  )

  const halfWidth = watermarkWidthPercentOfVideoWidth / 2
  const halfHeight = watermarkHeightPercentOfVideoHeight / 2

  // Convert center-position to top-left margins.
  // We cap the "inside frame" side but allow negative values.
  const leftMargin = clampPercent(
    Math.min(position.x - halfWidth, 100 - watermarkWidthPercentOfVideoWidth)
  )
  const topMargin = clampPercent(
    Math.min(position.y - halfHeight, 100 - watermarkHeightPercentOfVideoHeight)
  )

  const units = options?.units ?? '%'
  const marginX = units === 'px' ? toPxString(leftMargin, 'x') : toPercentString(leftMargin)
  const marginY = units === 'px' ? toPxString(topMargin, 'y') : toPercentString(topMargin)
  const width = units === 'px' ? toPxString(size, 'x') : `${size}%`

  const overlaySettings: MuxOverlaySettings = {
    vertical_align: 'top',
    vertical_margin: marginY,
    horizontal_align: 'left',
    horizontal_margin: marginX,
    width,
    opacity: `${Math.round(opacity * 100)}%`,
  }

  return overlaySettings
}
