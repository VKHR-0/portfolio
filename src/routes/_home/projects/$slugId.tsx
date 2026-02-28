import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/projects/$slugId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_home/projects/$slugId"!</div>
}
