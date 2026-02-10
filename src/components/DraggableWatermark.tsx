import {CheckmarkCircleIcon, ErrorOutlineIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Grid, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {convertWatermarkToMuxOverlay} from '../util/convertWatermarkToMux'
import type {MuxOverlaySettings, WatermarkConfig} from '../util/types'

const RangeInput = styled.input`
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--card-border-color);
  outline: none;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--card-focus-ring-color, #2276fc);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--card-focus-ring-color, #2276fc);
    cursor: pointer;
    border: 2px solid white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  &:hover::-webkit-slider-thumb {
    background: var(--card-focus-ring-color, #1a5fc7);
  }

  &:hover::-moz-range-thumb {
    background: var(--card-focus-ring-color, #1a5fc7);
  }
`

const WatermarkOverlay = styled.div<{$opacity: number}>`
  position: absolute;
  max-width: 200px;
  opacity: ${(props) => props.$opacity};
  cursor: move;
  user-select: none;
  z-index: 10;
  pointer-events: auto;

  img {
    width: 100%;
    height: auto;
    display: block;
    pointer-events: none;
  }

  &:hover {
    outline: 2px dashed rgba(255, 255, 255, 0.8);
    outline-offset: 4px;
  }
`

interface DraggableWatermarkProps {
  watermark: WatermarkConfig
  onChange: (watermark: WatermarkConfig) => void
  containerRef?: React.RefObject<HTMLDivElement>
  videoElementRef?: React.RefObject<HTMLVideoElement>
}

export default function DraggableWatermark({
  watermark,
  onChange,
  containerRef,
  videoElementRef,
}: DraggableWatermarkProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({x: 0, y: 0})
  const [startPosition, setStartPosition] = useState({x: 0, y: 0})
  const watermarkRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [localPosition, setLocalPosition] = useState(watermark.position || {x: 50, y: 50})

  const position = localPosition
  const size = watermark.size || 20
  const opacity = watermark.opacity ?? 0.7

  const parseOpacityPercent = (value: string | undefined): number | null => {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed.endsWith('%')) return null
    const num = Number(trimmed.slice(0, -1))
    if (!Number.isFinite(num)) return null
    return Math.max(0, Math.min(1, num / 100))
  }

  const getVideoContentBox = useCallback(() => {
    const container = containerRef?.current
    if (!container) return {x: 0, y: 0, width: 0, height: 0}

    const rect = container.getBoundingClientRect()
    const containerW = rect.width
    const containerH = rect.height

    const videoEl = videoElementRef?.current
    const videoW = videoEl?.videoWidth || 0
    const videoH = videoEl?.videoHeight || 0

    if (!videoW || !videoH || !containerW || !containerH) {
      return {x: 0, y: 0, width: containerW, height: containerH}
    }

    // object-fit: contain sizing
    const scale = Math.min(containerW / videoW, containerH / videoH)
    const contentW = videoW * scale
    const contentH = videoH * scale
    const offsetX = (containerW - contentW) / 2
    const offsetY = (containerH - contentH) / 2

    return {x: offsetX, y: offsetY, width: contentW, height: contentH}
  }, [containerRef, videoElementRef])

  const parseOverlayValue = (value: string | undefined): {n: number; unit: '%' | 'px'} | null => {
    if (!value) return null
    const trimmed = value.trim()
    const px = trimmed.endsWith('px')
    const pct = trimmed.endsWith('%')
    const num = Number(trimmed.replace(/px|%/g, ''))
    if (!Number.isFinite(num)) return null
    if (px) return {n: num, unit: 'px'}
    if (pct) return {n: num, unit: '%'}
    return null
  }

  const computeManualStyle = (overlay: MuxOverlaySettings) => {
    const rect = containerRef?.current?.getBoundingClientRect()
    const w = rect?.width ?? 0
    const h = rect?.height ?? 0
    const isVertical = h > w
    const baseW = isVertical ? 1080 : 1920
    const baseH = isVertical ? 1920 : 1080

    const hm = parseOverlayValue(overlay.horizontal_margin)
    const vm = parseOverlayValue(overlay.vertical_margin)
    const ww = parseOverlayValue(overlay.width)
    const manualOpacity = parseOpacityPercent(overlay.opacity)

    const toCss = (v: {n: number; unit: '%' | 'px'} | null, axis: 'x' | 'y') => {
      if (!v) return undefined
      if (v.unit === '%') return `${v.n}%`
      if (axis === 'x') return `${(v.n * w) / baseW}px`
      return `${(v.n * h) / baseH}px`
    }

    const computeHorizontalStyle = () => {
      if (overlay.horizontal_align === 'left') {
        return {left: toCss(hm, 'x'), right: undefined, transform: 'translate(0, 0)'}
      }
      if (overlay.horizontal_align === 'right') {
        return {right: toCss(hm, 'x'), left: undefined, transform: 'translate(0, 0)'}
      }
      return {left: '50%', right: undefined, transform: 'translate(-50%, 0)'}
    }

    const computeVerticalStyle = () => {
      if (overlay.vertical_align === 'top') {
        return {top: toCss(vm, 'y'), bottom: undefined}
      }
      if (overlay.vertical_align === 'bottom') {
        return {bottom: toCss(vm, 'y'), top: undefined}
      }
      return {top: '50%', bottom: undefined}
    }

    const hStyle = computeHorizontalStyle()
    const vStyle = computeVerticalStyle()

    let transform = hStyle.transform
    if (overlay.vertical_align === 'middle') {
      transform =
        overlay.horizontal_align === 'center' ? 'translate(-50%, -50%)' : 'translate(0, -50%)'
    }

    return {
      position: 'absolute' as const,
      ...hStyle,
      ...vStyle,
      transform,
      width: ww ? toCss(ww, 'x') : `${size}%`,
      opacity: manualOpacity ?? opacity,
      cursor: 'default',
    }
  }

  const debouncedOnChange = useCallback(
    (newWatermark: WatermarkConfig) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(() => {
        onChange(newWatermark)
      }, 300)
    },
    [onChange]
  )

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isDragging && watermark.position) {
      setLocalPosition(watermark.position)
    }
  }, [watermark.position, isDragging])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({x: e.clientX, y: e.clientY})
      setStartPosition({x: position.x, y: position.y})
    },
    [position]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef?.current) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const content = getVideoContentBox()
      const contentW = content.width || rect.width
      const contentH = content.height || rect.height
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y

      const deltaXPercent = (dx / contentW) * 100
      const deltaYPercent = (dy / contentH) * 100

      let newX = startPosition.x + deltaXPercent
      let newY = startPosition.y + deltaYPercent

      newX = Math.max(0, Math.min(100, newX))
      newY = Math.max(0, Math.min(100, newY))

      setLocalPosition({x: newX, y: newY})

      debouncedOnChange({
        ...watermark,
        position: {x: newX, y: newY},
      })
    },
    [
      isDragging,
      dragStart,
      startPosition,
      containerRef,
      watermark,
      debouncedOnChange,
      getVideoContentBox,
    ]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }
    onChange({
      ...watermark,
      position: localPosition,
    })
  }, [watermark, localPosition, onChange])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!watermark.imageUrl) {
    return null
  }

  const hasManualOverlay = Boolean(watermark.overlay_settings)
  const opacityForRender = hasManualOverlay
    ? (parseOpacityPercent(watermark.overlay_settings?.opacity) ?? opacity)
    : opacity
  const contentBox = getVideoContentBox()
  const hasContentBox = contentBox.width > 0 && contentBox.height > 0

  const computeWatermarkStyle = () => {
    if (hasManualOverlay) {
      return computeManualStyle(watermark.overlay_settings!)
    }
    if (hasContentBox) {
      return {
        left: `${contentBox.x + (position.x / 100) * contentBox.width}px`,
        top: `${contentBox.y + (position.y / 100) * contentBox.height}px`,
        transform: 'translate(-50%, -50%)',
        width: `${Math.max(1, (size / 100) * contentBox.width)}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }
    }
    return {
      left: `${position.x}%`,
      top: `${position.y}%`,
      transform: 'translate(-50%, -50%)',
      width: `${size}%`,
      cursor: isDragging ? 'grabbing' : 'grab',
    }
  }

  return (
    <WatermarkOverlay
      ref={watermarkRef}
      $opacity={opacityForRender}
      onMouseDown={hasManualOverlay ? undefined : handleMouseDown}
      style={computeWatermarkStyle()}
    >
      <img src={watermark.imageUrl} alt="Watermark" draggable={false} />
    </WatermarkOverlay>
  )
}

interface WatermarkControlsProps {
  watermark: WatermarkConfig
  onChange: (watermark: WatermarkConfig) => void
  onValidationChange?: (error: string | null) => void
  previewContainerRef?: React.RefObject<HTMLDivElement | null>
  previewVideoRef?: React.RefObject<HTMLVideoElement | null>
}

export function WatermarkControls({
  watermark,
  onChange,
  onValidationChange,
  previewContainerRef,
  previewVideoRef,
}: WatermarkControlsProps) {
  const [urlInput, setUrlInput] = useState(watermark.imageUrl || '')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [mode, setMode] = useState<'canvas' | 'manual'>(
    watermark.overlay_settings ? 'manual' : 'canvas'
  )

  const isUpdatingRef = useRef(false)

  const isValidExtension = (extension: string) => {
    return extension.endsWith('.png') || extension.endsWith('.jpg') || extension.endsWith('.jpeg')
  }

  const validateUrl = useCallback(
    (url: string) => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }

      if (!url) {
        setUrlError(null)
        setIsValid(null)
        setIsValidating(false)
        onValidationChange?.(null)
        isUpdatingRef.current = true
        onChange({
          ...watermark,
          enabled: false,
          imageUrl: undefined,
          overlay_settings: undefined,
        })
        return
      }

      setIsValidating(true)
      setIsValid(null)
      setUrlError(null)

      validationTimeoutRef.current = setTimeout(() => {
        try {
          const urlObj = new URL(url)
          const pathname = urlObj.pathname.toLowerCase()
          if (isValidExtension(pathname)) {
            setIsValid(true)
            setUrlError(null)
            onValidationChange?.(null)
            const img = new Image()
            img.onload = () => {
              const imageAspectRatio =
                img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1
              isUpdatingRef.current = true
              onChange({
                ...watermark,
                enabled: true,
                imageUrl: url,
                imageAspectRatio,
              })
            }
            img.onerror = () => {
              isUpdatingRef.current = true
              onChange({
                ...watermark,
                enabled: true,
                imageUrl: url,
                imageAspectRatio: watermark.imageAspectRatio,
              })
            }
            img.src = url
          } else {
            const errorMsg =
              'Mux only supports PNG and JPG watermark images. Please use a .png or .jpg file.'
            setIsValid(false)
            setUrlError(errorMsg)
            onValidationChange?.(errorMsg)
            isUpdatingRef.current = true
            onChange({
              ...watermark,
              enabled: false,
              imageUrl: undefined,
              imageAspectRatio: undefined,
              overlay_settings: undefined,
            })
          }
        } catch {
          setIsValid(false)
          const errorMsg = 'Please enter a valid URL (e.g., https://example.com/watermark.png)'
          setUrlError(errorMsg)
          onValidationChange?.(errorMsg)
          isUpdatingRef.current = true
          onChange({
            ...watermark,
            enabled: false,
            imageUrl: undefined,
            imageAspectRatio: undefined,
            overlay_settings: undefined,
          })
        } finally {
          setIsValidating(false)
        }
      }, 500)
    },
    [watermark, onChange, onValidationChange]
  )

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setMode(watermark.overlay_settings ? 'manual' : 'canvas')
  }, [watermark.overlay_settings])

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setUrlInput(url)

    if (watermark.imageUrl && url !== watermark.imageUrl) {
      isUpdatingRef.current = true
      onChange({
        ...watermark,
        enabled: false,
        imageUrl: undefined,
        imageAspectRatio: undefined,
        overlay_settings: undefined,
      })
    }

    validateUrl(url)
  }

  const normalizeZeroPercent = (value: string | undefined) => {
    if (!value) return value
    const trimmed = value.trim()
    if (!trimmed.endsWith('%')) return value
    const n = Number(trimmed.slice(0, -1))
    if (!Number.isFinite(n)) return value
    const epsilon = 1e-9
    if (n === 0 || Object.is(n, -0) || Math.abs(n) < epsilon) return '0.01%'
    return `${n}%`
  }

  const updateOverlaySettings = (next: Partial<MuxOverlaySettings>) => {
    const prev = watermark.overlay_settings
    const base: MuxOverlaySettings = prev ?? {
      vertical_align: 'bottom',
      vertical_margin: '2%',
      horizontal_align: 'right',
      horizontal_margin: '2%',
      width: `${watermark.size ?? 20}%`,
      opacity: `${Math.round((watermark.opacity ?? 0.7) * 100)}%`,
    }

    const merged: MuxOverlaySettings = {
      ...base,
      ...next,
    }

    onChange({
      ...watermark,
      enabled: true,
      overlay_settings: {
        ...merged,
        horizontal_margin:
          normalizeZeroPercent(merged.horizontal_margin) || merged.horizontal_margin,
        vertical_margin: normalizeZeroPercent(merged.vertical_margin) || merged.vertical_margin,
      },
    })
  }

  const getVideoContentBox = () => {
    const container = previewContainerRef?.current
    if (!container) return {x: 0, y: 0, width: 0, height: 0}

    const rect = container.getBoundingClientRect()
    const containerW = rect.width
    const containerH = rect.height

    const videoEl = previewVideoRef?.current
    const videoW = videoEl?.videoWidth || 0
    const videoH = videoEl?.videoHeight || 0

    if (!videoW || !videoH || !containerW || !containerH) {
      return {x: 0, y: 0, width: containerW, height: containerH}
    }

    const scale = Math.min(containerW / videoW, containerH / videoH)
    const contentW = videoW * scale
    const contentH = videoH * scale
    const offsetX = (containerW - contentW) / 2
    const offsetY = (containerH - contentH) / 2

    return {x: offsetX, y: offsetY, width: contentW, height: contentH}
  }

  return (
    <Stack space={3}>
      <Stack space={2}>
        <Text size={1} weight="medium">
          Watermark Image URL
        </Text>
        <Text size={0} muted>
          Enter a URL to a PNG or JPG image. Mux will download this image and overlay it on your
          video.
        </Text>
        <Box style={{position: 'relative', width: '100%'}}>
          <input
            type="url"
            value={urlInput}
            onChange={handleUrlChange}
            placeholder="https://example.com/watermark.png"
            style={{
              padding: '8px 12px',
              paddingRight: (() => {
                if (urlInput) return '96px'
                if (isValid !== null) return '36px'
                return '12px'
              })(),
              border: (() => {
                if (urlError || isValid === false) return '1px solid #e74c3c'
                if (isValid === true) return '1px solid #4caf50'
                return '1px solid #ccc'
              })(),
              borderRadius: '4px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              fontSize: '14px',
            }}
          />
          {(urlInput || isValidating || isValid !== null) && (
            <Box
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {urlInput && (
                <Button
                  text="Clear"
                  mode="bleed"
                  tone="critical"
                  onClick={() => {
                    setUrlInput('')
                    validateUrl('')
                  }}
                  disabled={isValidating}
                  style={{fontSize: '11px', height: '24px'}}
                />
              )}
              {isValidating && (
                <Text size={0} muted>
                  Validating...
                </Text>
              )}
              {isValid === true && !isValidating && (
                <CheckmarkCircleIcon style={{color: '#4caf50', fontSize: '18px'}} />
              )}
              {isValid === false && !isValidating && (
                <ErrorOutlineIcon style={{color: '#e74c3c', fontSize: '18px'}} />
              )}
            </Box>
          )}
        </Box>
        {urlError && (
          <Card padding={2} tone="critical" radius={2}>
            <Flex align="center" gap={2}>
              <ErrorOutlineIcon style={{color: '#e74c3c', flexShrink: 0}} />
              <Text size={0} style={{color: '#e74c3c'}}>
                {urlError}
              </Text>
            </Flex>
          </Card>
        )}
      </Stack>

      {watermark.imageUrl && (
        <Stack space={2}>
          <Card padding={3} tone="transparent" border radius={2}>
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              style={{flexWrap: 'wrap', alignItems: 'flex-start'}}
            >
              <Stack space={2} style={{minWidth: 240, flex: 1}}>
                <Text size={1} weight="medium">
                  Positioning mode
                </Text>
                <Text size={0} muted>
                  Choose between dragging on the canvas or manually editing the Mux{' '}
                  <code>overlay_settings</code> fields (as in{' '}
                  <a
                    href="https://www.mux.com/docs/guides/add-watermarks-to-your-videos"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    the docs
                  </a>
                  ).
                </Text>
              </Stack>
              <Flex gap={2} style={{flexWrap: 'wrap'}}>
                <Button
                  text="Canvas"
                  mode={mode === 'canvas' ? 'default' : 'ghost'}
                  onClick={() => {
                    setMode('canvas')
                    onChange({...watermark, enabled: true, overlay_settings: undefined})
                  }}
                />
                <Button
                  text="Manual"
                  mode={mode === 'manual' ? 'default' : 'ghost'}
                  onClick={() => {
                    setMode('manual')
                    const overlay = convertWatermarkToMuxOverlay({...watermark, enabled: true})
                    updateOverlaySettings(overlay ?? {})
                  }}
                />
              </Flex>
            </Flex>
          </Card>

          {mode === 'manual' && (
            <Card padding={3} tone="transparent" border radius={2}>
              <Stack space={3}>
                <Text size={1} weight="medium">
                  Mux overlay_settings
                </Text>
                <Grid columns={[1, 2]} gap={3} style={{width: '100%'}}>
                  <Stack space={2} style={{minWidth: 0}}>
                    <Text size={0} muted>
                      horizontal_align
                    </Text>
                    <select
                      value={watermark.overlay_settings?.horizontal_align || 'right'}
                      onChange={(e) =>
                        updateOverlaySettings({
                          horizontal_align: (e.target.value ||
                            'right') as MuxOverlaySettings['horizontal_align'],
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                    >
                      <option value="left">left</option>
                      <option value="center">center</option>
                      <option value="right">right</option>
                    </select>
                  </Stack>
                  <Stack space={2} style={{minWidth: 0}}>
                    <Text size={0} muted>
                      horizontal_margin (e.g. 2% or 40px)
                    </Text>
                    <TextInput
                      value={watermark.overlay_settings?.horizontal_margin || '2%'}
                      onChange={(e) =>
                        updateOverlaySettings({horizontal_margin: e.currentTarget.value})
                      }
                    />
                  </Stack>
                  <Stack space={2} style={{minWidth: 0}}>
                    <Text size={0} muted>
                      vertical_align
                    </Text>
                    <select
                      value={watermark.overlay_settings?.vertical_align || 'bottom'}
                      onChange={(e) =>
                        updateOverlaySettings({
                          vertical_align: (e.target.value ||
                            'bottom') as MuxOverlaySettings['vertical_align'],
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #ccc',
                        borderRadius: 4,
                      }}
                    >
                      <option value="top">top</option>
                      <option value="middle">middle</option>
                      <option value="bottom">bottom</option>
                    </select>
                  </Stack>
                  <Stack space={2} style={{minWidth: 0}}>
                    <Text size={0} muted>
                      vertical_margin (e.g. 2% or 40px)
                    </Text>
                    <TextInput
                      value={watermark.overlay_settings?.vertical_margin || '2%'}
                      onChange={(e) =>
                        updateOverlaySettings({vertical_margin: e.currentTarget.value})
                      }
                    />
                  </Stack>
                  <Stack space={2} style={{minWidth: 0}}>
                    <Text size={0} muted>
                      width (e.g. 25% or 80px)
                    </Text>
                    <TextInput
                      value={watermark.overlay_settings?.width || `${watermark.size ?? 20}%`}
                      onChange={(e) => updateOverlaySettings({width: e.currentTarget.value})}
                    />
                  </Stack>
                  <Stack space={2} style={{minWidth: 0}}>
                    <Text size={0} muted>
                      opacity (e.g. 90%)
                    </Text>
                    <TextInput
                      value={
                        watermark.overlay_settings?.opacity ||
                        `${Math.round((watermark.opacity ?? 0.7) * 100)}%`
                      }
                      onChange={(e) => updateOverlaySettings({opacity: e.currentTarget.value})}
                    />
                  </Stack>
                </Grid>
                <Text size={0} muted>
                  Margins and width accept either percentages or pixels, per the Mux guide.
                </Text>
              </Stack>
            </Card>
          )}

          {mode === 'canvas' && (
            <>
              <Box>
                <Text size={1} weight="medium">
                  {(() => {
                    const sizePct = watermark.size || 20
                    const contentW = getVideoContentBox().width
                    if (!contentW) return `Size: ${sizePct}%`
                    const px = Math.max(1, Math.round((sizePct / 100) * contentW))
                    return `Size: ${px}px`
                  })()}
                </Text>
                <RangeInput
                  type="range"
                  value={(() => {
                    const sizePct = watermark.size || 20
                    const contentW = getVideoContentBox().width
                    if (!contentW) return sizePct
                    return Math.max(1, Math.round((sizePct / 100) * contentW))
                  })()}
                  min={(() => {
                    const contentW = getVideoContentBox().width
                    if (!contentW) return 5
                    return Math.max(1, Math.round(contentW * 0.05))
                  })()}
                  max={(() => {
                    const contentW = getVideoContentBox().width
                    if (!contentW) return 50
                    return Math.max(1, Math.round(contentW * 0.5))
                  })()}
                  step={1}
                  onChange={(e) => {
                    const raw = Number(e.target.value)
                    const contentW = getVideoContentBox().width
                    const nextPct = contentW ? (raw / contentW) * 100 : raw
                    const clampedPct = Math.max(5, Math.min(50, nextPct))
                    onChange({
                      ...watermark,
                      size: clampedPct,
                    })
                  }}
                />
              </Box>

              <Box>
                <Text size={1} weight="medium">
                  Opacity: {Math.round((watermark.opacity ?? 0.7) * 100)}%
                </Text>
                <RangeInput
                  type="range"
                  value={watermark.opacity ?? 0.7}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(e) =>
                    onChange({
                      ...watermark,
                      opacity: Number(e.target.value),
                    })
                  }
                />
              </Box>
            </>
          )}

          <Card padding={2} tone="transparent" border radius={2}>
            <Text size={0} muted>
              {mode === 'manual'
                ? 'Manual mode: edit the overlay_settings fields above'
                : '💡 Drag the watermark on the preview to position it'}
            </Text>
          </Card>
        </Stack>
      )}
    </Stack>
  )
}
