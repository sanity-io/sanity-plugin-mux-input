import { ChevronLeftIcon, ChevronRightIcon } from '@sanity/icons'
import { Label, Button } from '@sanity/ui'

import { Dispatch, SetStateAction, useState } from 'react'

const PageSelector = (props: { page: number, setPage: Dispatch<SetStateAction<number>>, total: number, limit: number }) => {

	const page = props.page
	const setPage = props.setPage

	if (Math.min(props.total - 1, Math.max(0, page)) !== page) // Constraint in bounds.
		setPage((page) => Math.min(props.total - 1, Math.max(0, page)))

	return (
		<>
			<Button icon={ChevronLeftIcon} mode="bleed" padding={3} style={{ cursor: "pointer" }} disabled={page <= 0} onClick={() => {
				setPage((page) => { return Math.min(props.total - 1, Math.max(0, page - 1)) })
			}} />
			<Label muted>Page {page + 1}/{props.total}</Label>
			<Button icon={ChevronRightIcon} mode="bleed" padding={3} style={{ cursor: "pointer" }} disabled={page >= props.total - 1} onClick={() => {
				setPage((page) => { return Math.min(props.total - 1, Math.max(0, page + 1)) })
			}} />
		</>
	)
}

export default PageSelector