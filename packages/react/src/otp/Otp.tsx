import type * as React from 'react';
import { splitProps } from '../preset';
import { OTP_KEYS } from './keys';
import { useOtp } from './useOtp';
import type { OtpConfig, OtpTagProps } from './types';

/** The otp as a tag: the config as props, plus any attribute of the element. */
export function Otp(props: OtpTagProps): React.ReactElement {
  const [config, root] = splitProps<OtpConfig>(props as unknown as Record<string, unknown>, OTP_KEYS);
  return useOtp(config).render(root);
}
