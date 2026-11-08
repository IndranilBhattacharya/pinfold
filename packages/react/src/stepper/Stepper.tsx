import type * as React from 'react';
import { splitProps } from '../preset';
import { STEPPER_KEYS } from './keys';
import { useStepper } from './useStepper';
import type { StepperConfig, StepperTagProps } from './types';

/** The stepper as a tag: the config as props, plus any attribute of the element. */
export function Stepper(props: StepperTagProps): React.ReactElement {
  const [config, root] = splitProps<StepperConfig>(props as unknown as Record<string, unknown>, STEPPER_KEYS);
  return useStepper(config).render(root);
}
