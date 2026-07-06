import { route, type RouteConfig } from '@react-router/dev/routes'

export default [
  route('/', 'routes/App/index.tsx', { id: 'app' }),
  route('/domain', 'routes/Debug/domain.tsx', { id: 'domain' }),
  route('/playback', 'routes/Debug/playback.tsx', { id: 'playback' }),
  route('/editor', 'routes/Debug/editor.tsx', { id: 'editor' }),
] satisfies RouteConfig
