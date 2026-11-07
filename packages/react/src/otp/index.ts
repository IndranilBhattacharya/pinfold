/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/otp.css'.
   Server-safe barrel: `defineOtp` here, the client module re-exported. */

export { Otp, useOtp } from './client';
export { Otp as default } from './client';
export { defineOtp, type DefinedOtp, type OtpPresetProps } from './define';
export type { OtpApi, OtpComponent, OtpConfig, OtpRootProps, OtpTagProps, OtpSlot, OtpState, OtpVariant, OtpDimensions } from './types';
