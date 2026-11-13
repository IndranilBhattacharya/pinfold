/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/avatar.css'.
   Server-safe barrel: `defineAvatar` here, the client module re-exported. */

export { Avatar, useAvatar } from './client';
export { Avatar as default } from './client';
export { defineAvatar, type DefinedAvatar, type AvatarPresetProps } from './define';
export type { AvatarApi, AvatarComponent, AvatarConfig, AvatarRootProps, AvatarTagProps, AvatarSlot, AvatarState, AvatarPerson, AvatarShape, AvatarStatus, AvatarDimensions, AvatarSize, AvatarTone, AvatarStatusPlacement, AvatarLoadingStatus, AvatarSurplus } from './types';
