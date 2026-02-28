import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/posts/$slugId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_home/posts/$slugId"!</div>
}
