/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/tags.css'.
   Server-safe barrel: `defineTags` here, the client module re-exported. */

export { Tags, useTags } from './client';
export { Tags as default } from './client';
export { defineTags, type DefinedTags, type TagsPresetProps } from './define';
export type { TagsApi, TagsComponent, TagsConfig, TagsRootProps, TagsTagProps, TagsSlot, TagsState, TagsItem, TagsVariant } from './types';
