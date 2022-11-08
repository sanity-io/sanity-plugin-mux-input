import React, {useId, useMemo} from 'react'

// Mapping ids to ensure filter refs are unique, otherwise all Logo instances are hidden if the first SVG is hidden, due to how SVGs deal with relative links and ids
const ids = [
  'title',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
] as const
export interface Props {
  height?: number
}
export default function MuxLogo({height = 26}) {
  const id = useId()
  const [titleId, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r] = useMemo<typeof ids>(
    () => ids.map((field) => `${id}-${field}`) as unknown as typeof ids,
    [id]
  )

  return (
    <svg
      aria-labelledby={titleId}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      viewBox="92.08878326416016 102.66712188720703 692.76123046875 219.99948120117188"
      style={{height: `${height}px`}}
    >
      <title id={titleId}>Mux Logo</title>
      <defs>
        <linearGradient
          id={c}
          spreadMethod="pad"
          gradientTransform="matrix(528.38055 0 0 -528.38055 63.801 159.5)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={d}
          spreadMethod="pad"
          gradientTransform="matrix(523.66766 0 0 -523.66766 67.897 159.5)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={g}
          spreadMethod="pad"
          gradientTransform="rotate(180 296.075 79.75) scale(524.84045)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={i}
          spreadMethod="pad"
          gradientTransform="matrix(524.84045 0 0 -524.84045 63.801 159.5)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={j}
          spreadMethod="pad"
          gradientTransform="matrix(523.08514 0 0 -523.08514 67.897 224.446)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={k}
          spreadMethod="pad"
          gradientTransform="matrix(524.84045 0 0 -524.84045 63.801 94.553)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={l}
          spreadMethod="pad"
          gradientTransform="matrix(524.84045 0 0 -524.84045 63.801 159.5)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={m}
          spreadMethod="pad"
          gradientTransform="matrix(524.84045 0 0 -524.84045 63.801 94.554)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={p}
          spreadMethod="pad"
          gradientTransform="matrix(521.97632 0 0 -521.97632 69.067 191.973)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={q}
          spreadMethod="pad"
          gradientTransform="matrix(523.09039 0 0 -523.09039 67.312 191.973)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <linearGradient
          id={r}
          spreadMethod="pad"
          gradientTransform="matrix(524.84045 0 0 -524.84045 63.801 159.5)"
          gradientUnits="userSpaceOnUse"
          y2={0}
          x2={1}
          y1={0}
          x1={0}
        >
          <stop
            offset={0}
            style={{
              stopOpacity: 1,
              stopColor: '#ff4e00',
            }}
          />
          <stop
            offset={1}
            style={{
              stopOpacity: 1,
              stopColor: '#ff1791',
            }}
          />
        </linearGradient>
        <clipPath id={a} clipPathUnits="userSpaceOnUse">
          <path d="M0 319h657.706V0H0Z" />
        </clipPath>
        <clipPath id={b} clipPathUnits="userSpaceOnUse">
          <path d="M423.64 242h164.999V77H423.64Z" />
        </clipPath>
        <clipPath id={e} clipPathUnits="userSpaceOnUse">
          <path d="M0 319h657.706V0H0Z" />
        </clipPath>
        <clipPath id={f} clipPathUnits="userSpaceOnUse">
          <path d="M311.3 242h93.031V77H311.3Z" />
        </clipPath>
        <clipPath id={h} clipPathUnits="userSpaceOnUse">
          <path d="M198.96 242h35.106V77H198.96Z" />
        </clipPath>
        <clipPath id={n} clipPathUnits="userSpaceOnUse">
          <path d="M0 319h657.706V0H0Z" />
        </clipPath>
        <clipPath id={o} clipPathUnits="userSpaceOnUse">
          <path d="M69.067 242H169.12V141.947H69.067Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${a})`} transform="matrix(1.33333 0 0 -1.33333 0 425.333)">
        <g
          style={{
            opacity: 0.69999701,
          }}
          clipPath={`url(#${b})`}
        >
          <path
            style={{
              fill: `url(#${c})`,
              stroke: 'none',
            }}
            d="M558.674 82.142c6.855-6.855 17.969-6.855 24.824 0 6.854 6.855 6.854 17.969 0 24.823L453.605 236.858c-6.855 6.855-17.969 6.855-24.824 0s-6.855-17.969 0-24.823z"
          />
        </g>
      </g>
      <path
        style={{
          fill: `url(#${d})`,
          stroke: 'none',
        }}
        d="M558.674 236.858 428.781 106.966c-6.855-6.855-6.855-17.969 0-24.825 6.855-6.854 17.969-6.854 24.823 0l129.894 129.894c6.854 6.855 6.854 17.968 0 24.823A17.498 17.498 0 0 1 571.086 242a17.495 17.495 0 0 1-12.412-5.142"
        transform="matrix(1.33333 0 0 -1.33333 0 425.333)"
      />
      <g clipPath={`url(#${e})`} transform="matrix(1.33333 0 0 -1.33333 0 425.333)">
        <g
          style={{
            opacity: 0.69999701,
          }}
          clipPath={`url(#${f})`}
        >
          <path
            style={{
              fill: `url(#${g})`,
              stroke: 'none',
            }}
            d="M328.853 112.107c22.297 0 40.372 18.075 40.372 40.372v71.315c0 10.054 7.505 18.206 17.554 18.206 10.048 0 17.552-8.152 17.552-18.206v-71.315c0-41.686-33.793-75.479-75.478-75.479-9.694 0-17.553 7.859-17.553 17.554 0 9.694 7.859 17.553 17.553 17.553"
          />
        </g>
        <g
          style={{
            opacity: 0.69999701,
          }}
          clipPath={`url(#${h})`}
        >
          <path
            style={{
              fill: `url(#${i})`,
              stroke: 'none',
            }}
            d="M216.513 242c-10.049 0-17.553-8.152-17.553-18.206V95.206c0-10.054 7.504-18.206 17.553-18.206 10.048 0 17.553 8.152 17.553 18.206v128.588c0 10.054-7.505 18.206-17.553 18.206"
          />
        </g>
      </g>
      <path
        style={{
          fill: `url(#${j})`,
          stroke: 'none',
        }}
        d="M369.225 224.447c0-9.694 7.859-17.553 17.553-17.553 9.695 0 17.553 7.859 17.553 17.553s-7.858 17.552-17.553 17.552c-9.694 0-17.553-7.858-17.553-17.552"
        transform="matrix(1.33333 0 0 -1.33333 0 425.333)"
      />
      <path
        style={{
          fill: `url(#${k})`,
          stroke: 'none',
        }}
        d="M553.532 94.554c0-9.695 7.859-17.554 17.553-17.554 9.695 0 17.554 7.859 17.554 17.554 0 9.694-7.859 17.552-17.554 17.552-9.694 0-17.553-7.858-17.553-17.552"
        transform="matrix(1.33333 0 0 -1.33333 0 425.333)"
      />
      <path
        style={{
          fill: `url(#${l})`,
          stroke: 'none',
        }}
        d="M69.067 223.794V95.206C69.067 85.152 76.571 77 86.62 77c10.048 0 17.553 8.152 17.553 18.206v128.588c0 10.055-7.505 18.205-17.553 18.205-10.049 0-17.553-8.15-17.553-18.205"
        transform="matrix(1.33333 0 0 -1.33333 0 425.333)"
      />
      <path
        style={{
          fill: `url(#${m})`,
          stroke: 'none',
        }}
        d="M198.96 94.554c0-9.695 7.859-17.554 17.553-17.554 9.695 0 17.554 7.859 17.554 17.554 0 9.694-7.859 17.553-17.554 17.553-9.694 0-17.553-7.859-17.553-17.553"
        transform="matrix(1.33333 0 0 -1.33333 0 425.333)"
      />
      <g clipPath={`url(#${n})`} transform="matrix(1.33333 0 0 -1.33333 0 425.333)">
        <g
          style={{
            opacity: 0.69999701,
          }}
          clipPath={`url(#${o})`}
        >
          <path
            style={{
              fill: `url(#${p})`,
              stroke: 'none',
            }}
            d="M139.155 147.088c6.855-6.855 17.969-6.855 24.824 0s6.855 17.969 0 24.824l-64.947 64.946c-6.855 6.855-17.969 6.855-24.824 0s-6.855-17.969 0-24.823z"
          />
        </g>
      </g>
      <path
        style={{
          fill: `url(#${q})`,
          stroke: 'none',
        }}
        d="m204.101 236.858-64.947-64.946c-6.854-6.855-6.854-17.969 0-24.824 6.856-6.855 17.97-6.855 24.824 0l64.947 64.947c6.855 6.855 6.855 17.968 0 24.823A17.495 17.495 0 0 1 216.513 242a17.498 17.498 0 0 1-12.412-5.142"
        transform="matrix(1.33333 0 0 -1.33333 0 425.333)"
      />
      <path
        style={{
          fill: `url(#${r})`,
          stroke: 'none',
        }}
        d="M253.374 223.794v-71.315c0-41.685 33.793-75.479 75.479-75.479 9.695 0 17.553 7.859 17.553 17.554 0 9.694-7.858 17.553-17.553 17.553-22.297 0-40.372 18.075-40.372 40.372v71.315c0 10.055-7.505 18.205-17.554 18.205s-17.553-8.15-17.553-18.205"
        transform="matrix(1.33333 0 0 -1.33333 0 425.333)"
      />
    </svg>
  )
}
