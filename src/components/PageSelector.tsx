import {ChevronLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Button, Label} from '@sanity/ui'
import {Dispatch, SetStateAction, useEffect} from 'react'

const PageSelector = (props: {
  page: number
  setPage: Dispatch<SetStateAction<number>>
  total: number
}) => {
  const page = props.page
  const setPage = props.setPage

  useEffect(() => {
    // Constraint in bounds.
    const clamped = Math.min(props.total - 1, Math.max(0, page))
    if (page !== clamped) {
      setPage(clamped)
    }
  }, [page, props.total, setPage])

  return (
    <>
      <Button
        icon={ChevronLeftIcon}
        mode="bleed"
        padding={3}
        style={{cursor: 'pointer'}}
        disabled={page <= 0}
        onClick={() => {
          setPage((p) => {
            return Math.min(props.total - 1, Math.max(0, p - 1))
          })
        }}
      />
      <Label muted>
        Page {page + 1}/{props.total}
      </Label>
      <Button
        icon={ChevronRightIcon}
        mode="bleed"
        padding={3}
        style={{cursor: 'pointer'}}
        disabled={page >= props.total - 1}
        onClick={() => {
          setPage((p) => {
            return Math.min(props.total - 1, Math.max(0, p + 1))
          })
        }}
      />
    </>
  )
}

export default PageSelector
