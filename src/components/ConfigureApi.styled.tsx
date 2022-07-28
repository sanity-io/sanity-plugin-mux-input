import React from 'react'
import styled from 'styled-components'

import MuxLogo from './MuxLogo'

const Logo = styled.span`
  display: inline-block;
  height: 0.8em;
  margin-right: 1em;
  transform: translate(0.3em, -0.2em);
`

export const Header = () => (
  <>
    <Logo>
      <MuxLogo height={13} />
    </Logo>
    API Credentials
  </>
)
