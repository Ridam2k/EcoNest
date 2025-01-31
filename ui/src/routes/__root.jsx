import * as React from 'react'
import { Outlet, createRootRoute, Link } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      {/* <div>Hello "__root"!</div>
      <Link to="/register" className="[&.active]:font-bold">
          About
        </Link> */}
      <Outlet />
    </React.Fragment>
  )
}
