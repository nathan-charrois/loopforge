import { route, type RouteConfig } from '@react-router/dev/routes'

export default [
  route('/', 'routes/App/index.tsx', { id: 'app' }),
  route('/chord', 'routes/Debug/chord.tsx', { id: 'chord' }),
  route('/playback', 'routes/Debug/playback.tsx', { id: 'playback' }),
  route('/notes', 'routes/Debug/notes.tsx', { id: 'notes' }),
  route('/arrangement', 'routes/Debug/arrangement.tsx', { id: 'arrangement' }),
] satisfies RouteConfig
