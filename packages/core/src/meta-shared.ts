import type { PropMeta } from './meta';

/** The `radius` option every component shares (see `radiusProps`). */
export const RADIUS_PROP: PropMeta = {
  type: 'enum',
  values: ['none', 'sm', 'md', 'lg', 'full'],
  orLength: true,
  auto: 'md, the theme radius',
  description:
    'Corner radius: a preset rescales every corner inside (frame, rows, chips, popup) like the theme presets; a length (`12` is px) sets the frame. Default: the theme radius.',
  group: 'appearance',
  control: true,
};
