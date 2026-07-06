import { route, type RouteConfig } from '@react-router/dev/routes'

export default [
  route('/', 'routes/App/index.tsx', { id: 'app' }),
  route('/debug', 'routes/Debug/index.tsx', { id: 'debug' }),
] satisfies RouteConfig
