import { cn } from './utils';

type VariantShape = Record<string, Record<string, string>>;

export type VariantProps<V extends VariantShape> = {
  [K in keyof V]?: keyof V[K] | null | undefined;
};

/**
 * 20-line class-variance resolver. Same ergonomics as `cva` without the
 * dependency or its runtime — components are static strings plus a lookup.
 */
export function variants<V extends VariantShape>(config: {
  base?: string;
  variants: V;
  defaultVariants?: VariantProps<V>;
}) {
  const { base = '', variants: map, defaultVariants = {} as VariantProps<V> } = config;

  return function resolve(props?: VariantProps<V> & { className?: string }): string {
    let out = base;
    for (const key in map) {
      const chosen = props?.[key] ?? defaultVariants[key];
      if (chosen == null) continue;
      const cls = map[key][chosen as string];
      if (cls) out = cn(out, cls);
    }
    return cn(out, props?.className);
  };
}
