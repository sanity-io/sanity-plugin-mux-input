import {SortIcon} from '@sanity/icons'
import {Button, Menu, MenuButton, MenuItem, PopoverProps} from '@sanity/ui'
import React, {useId} from 'react'

import {ASSET_SORT_OPTIONS, SortOption} from '../hooks/useAssets'

export const CONTEXT_MENU_POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
  width: 0,
}

/**
 * @sanity/ui components adapted from:
 * https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/desk/components/pane/PaneContextMenuButton.tsx#L19
 */
export function SelectSortOptions(props: {sort: SortOption; setSort: (s: SortOption) => void}) {
  const id = useId()

  return (
    <MenuButton
      button={
        <Button text="Sort" icon={SortIcon} mode="bleed" padding={3} style={{cursor: 'pointer'}} />
      }
      id={id}
      menu={
        <Menu>
          {Object.entries(ASSET_SORT_OPTIONS).map(([type, {label}]) => (
            <MenuItem
              key={type}
              data-as="button"
              onClick={() => props.setSort(type as SortOption)}
              padding={3}
              tone="default"
              text={label}
              pressed={type === props.sort}
            />
          ))}
        </Menu>
      }
      popover={CONTEXT_MENU_POPOVER_PROPS}
    />
  )
}
