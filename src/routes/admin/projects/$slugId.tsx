import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/projects/$slugId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/projects/edit"!</div>
}
