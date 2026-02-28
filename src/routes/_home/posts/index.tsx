import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_home/posts/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_home/posts/"!</div>
}
