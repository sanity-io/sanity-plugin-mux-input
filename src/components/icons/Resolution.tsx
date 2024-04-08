import type {SVGProps} from 'react'

export function ResolutionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M20 9V6h-3V4h5v5h-2ZM2 9V4h5v2H4v3H2Zm15 11v-2h3v-3h2v5h-5ZM2 20v-5h2v3h3v2H2Zm4-4V8h12v8H6Zm2-2h8v-4H8v4Zm0 0v-4v4Z"
      />
    </svg>
  )
}
