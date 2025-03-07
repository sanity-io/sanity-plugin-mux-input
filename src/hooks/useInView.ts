import {useEffect, useState} from 'react'

type IntersectionOptions = {
  root?: Element | null
  rootMargin?: string
  threshold?: number
  onChange?: (inView: boolean) => void
}

export function useInView(
  ref: React.RefObject<HTMLDivElement | null>,
  options: IntersectionOptions = {}
) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry], obs) => {
      // ==== from react-intersection-observer ====
      // While it would be nice if you could just look at isIntersecting to determine if the component is inside the viewport, browsers can't agree on how to use it.
      // -Firefox ignores `threshold` when considering `isIntersecting`, so it will never be false again if `threshold` is > 0
      const nowInView =
        entry.isIntersecting &&
        obs.thresholds.some((threshold) => entry.intersectionRatio >= threshold)

      // Update our state when observer callback fires
      setInView(nowInView)
      options?.onChange?.(nowInView)
    }, options)

    const toObserve = ref.current
    observer.observe(toObserve)

    // eslint-disable-next-line
    return () => {
      if (toObserve) observer.unobserve(toObserve)
    }
  }, [options, ref])

  return inView
}
