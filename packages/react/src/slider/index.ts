/* Styles ship separately: import '@pinfold/css/core.css'; import '@pinfold/css/slider.css'.
   Server-safe barrel: `defineSlider` here, the client module re-exported. */

export { Slider, useSlider } from './client';
export { Slider as default } from './client';
export { defineSlider, type DefinedSlider, type SliderPresetProps } from './define';
export type { SliderApi, SliderComponent, SliderConfig, SliderRootProps, SliderTagProps, SliderSlot, SliderState, SliderMark, SliderDimensions } from './types';
