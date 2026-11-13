import type { PinfoldDir, PinfoldLazy, PinfoldRadius, PinfoldSize, PinfoldStylePack, PinfoldTheme, PinfoldTone } from '@pinfold/core';
import type { PinfoldNavigate } from './link';
import type { AccordionOptions } from './accordion/types';
import type { ButtonConfig } from './button/types';
import type { SpinnerConfig } from './spinner/types';
import type { SeparatorConfig } from './separator/types';
import type { KbdConfig } from './kbd/types';
import type { SkeletonConfig } from './skeleton/types';
import type { BadgeConfig } from './badge/types';
import type { ColorPickerConfig } from './colorpicker/types';
import type { TourConfig } from './tour/types';
import type { FileUploadConfig } from './fileupload/types';
import type { TreeViewConfig } from './treeview/types';
import type { CursorConfig } from './cursor/types';
import type { NavbarConfig } from './navbar/types';
import type { AppShellConfig } from './appshell/types';
import type { ScrollAreaConfig } from './scrollarea/types';
import type { NavMenuConfig } from './navmenu/types';
import type { SidebarConfig } from './sidebar/types';
import type { ResizableConfig } from './resizable/types';
import type { CarouselConfig } from './carousel/types';
import type { EmptyConfig } from './empty/types';
import type { TimelineConfig } from './timeline/types';
import type { RatingConfig } from './rating/types';
import type { TableConfig } from './table/types';
import type { DatePickerConfig } from './datepicker/types';
import type { CalendarConfig } from './calendar/types';
import type { CommandConfig } from './command/types';
import type { TagsConfig } from './tags/types';
import type { ComboboxConfig } from './combobox/types';
import type { SelectConfig } from './select/types';
import type { StepperConfig } from './stepper/types';
import type { PaginationConfig } from './pagination/types';
import type { BreadcrumbConfig } from './breadcrumb/types';
import type { TabsConfig } from './tabs/types';
import type { OtpConfig } from './otp/types';
import type { NumberFieldConfig } from './number/types';
import type { SliderConfig } from './slider/types';
import type { ToolbarConfig } from './toolbar/types';
import type { ToggleConfig } from './toggle/types';
import type { SwitchConfig } from './switch/types';
import type { RadioConfig } from './radio/types';
import type { CheckboxConfig } from './checkbox/types';
import type { InputConfig } from './input/types';
import type { ToastConfig } from './toast/types';
import type { MenuConfig } from './menu/types';
import type { DialogConfig } from './dialog/types';
import type { PopoverConfig } from './popover/types';
import type { TooltipConfig } from './tooltip/types';
import type { ProgressConfig } from './progress/types';
import type { CardConfig } from './card/types';
import type { AvatarConfig } from './avatar/types';
import type { AlertConfig } from './alert/types';

/** Per-component defaults. Data, state and ids never belong here, only how components look and behave. */
export interface PinfoldComponentDefaults {
  accordion?: Omit<AccordionOptions, 'value' | 'defaultValue' | 'disabledIds' | 'id'>;
  button?: Omit<ButtonConfig, 'label' | 'onClick' | 'href' | 'target' | 'rel' | 'loading' | 'loadingText' | 'disabled' | 'onNavigate' | 'startContent' | 'endContent'>;
  spinner?: SpinnerConfig;
  separator?: Omit<SeparatorConfig, 'label'>;
  kbd?: Omit<KbdConfig, 'keys'>;
  skeleton?: Omit<SkeletonConfig, 'content' | 'loading'>;
  badge?: Omit<BadgeConfig, 'label' | 'count' | 'anchor' | 'avatar' | 'onClick' | 'href' | 'target' | 'rel' | 'onDismiss'>;
  colorpicker?: Omit<ColorPickerConfig, 'label'>;
  tour?: Omit<TourConfig, 'steps' | 'open' | 'defaultOpen' | 'step' | 'defaultStep' | 'beforeStep' | 'onOpenChange' | 'onStepChange' | 'onComplete' | 'onSkip'>;
  fileupload?: Omit<FileUploadConfig, 'label' | 'description' | 'name' | 'value' | 'defaultValue' | 'validate' | 'upload' | 'disabled' | 'onChange' | 'onReject' | 'onUploadComplete' | 'onUploadError'>;
  treeview?: Omit<TreeViewConfig, 'label' | 'items' | 'value' | 'defaultValue' | 'expanded' | 'defaultExpanded' | 'loadChildren' | 'filter' | 'disabled' | 'onSelectionChange' | 'onExpandedChange' | 'onAction' | 'onMove' | 'onFilterChange' | 'onLoadError'>;
  cursor?: Omit<CursorConfig, 'content' | 'label' | 'shape' | 'onStateChange' | 'onVisibleChange' | 'disabled'>;
  navbar?: Omit<NavbarConfig, 'label' | 'items' | 'brand' | 'value' | 'defaultValue' | 'onChange' | 'onNavigate' | 'start' | 'center' | 'end' | 'actions'>;
  appshell?: Omit<AppShellConfig, 'content' | 'navbar' | 'sidebar' | 'aside' | 'footer' | 'sidebarOpen' | 'defaultSidebarOpen' | 'onSidebarOpenChange'>;
  scrollarea?: Omit<ScrollAreaConfig, 'content' | 'label' | 'onReachStart' | 'onReachEnd' | 'onEdgesChange' | 'onScroll'>;
  navmenu?: Omit<NavMenuConfig, 'items' | 'label'>;
  sidebar?: Omit<SidebarConfig, 'items' | 'label'>;
  resizable?: Omit<ResizableConfig, 'label' | 'panels' | 'sizes' | 'onResize' | 'autoSaveId'>;
  carousel?: Omit<CarouselConfig, 'label' | 'slides' | 'index' | 'defaultIndex' | 'onIndexChange'>;
  empty?: Omit<EmptyConfig, 'title' | 'description' | 'media' | 'actions'>;
  timeline?: Omit<TimelineConfig, 'label' | 'items' | 'onOpenChange' | 'onItemClick'>;
  rating?: Omit<RatingConfig, 'label' | 'value' | 'defaultValue' | 'onChange' | 'name' | 'disabled'>;
  table?: Omit<TableConfig, 'label' | 'rows' | 'columns' | 'rowKey' | 'sort' | 'defaultSort' | 'onSortChange' | 'selected' | 'defaultSelected' | 'onSelectionChange' | 'page' | 'defaultPage' | 'onPageChange' | 'total' | 'onRowAction' | 'loading'>;
  datepicker?: Omit<DatePickerConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'isDateDisabled' | 'open' | 'defaultOpen' | 'onOpenChange' | 'placeholder'>;
  calendar?: Omit<CalendarConfig, 'value' | 'defaultValue' | 'onChange' | 'month' | 'defaultMonth' | 'onMonthChange' | 'min' | 'max' | 'isDateDisabled'>;
  command?: Omit<CommandConfig, 'label' | 'items' | 'onSelect' | 'inputValue' | 'defaultInputValue' | 'onInputChange' | 'loading' | 'open' | 'defaultOpen' | 'onOpenChange'>;
  tags?: Omit<TagsConfig, 'label' | 'items' | 'value' | 'defaultValue' | 'onChange' | 'onRemove'>;
  combobox?: Omit<ComboboxConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'items' | 'value' | 'defaultValue' | 'onChange' | 'inputValue' | 'defaultInputValue' | 'onInputChange' | 'placeholder' | 'loading' | 'open' | 'defaultOpen' | 'onOpenChange'>;
  select?: Omit<SelectConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'items' | 'value' | 'defaultValue' | 'onChange' | 'placeholder' | 'open' | 'defaultOpen' | 'onOpenChange'>;
  stepper?: Omit<StepperConfig, 'items' | 'value' | 'defaultValue' | 'onChange' | 'beforeChange'>;
  pagination?: Omit<PaginationConfig, 'count' | 'page' | 'defaultPage' | 'onChange' | 'hasPrevious' | 'onPageSizeChange'>;
  breadcrumb?: Omit<BreadcrumbConfig, 'items' | 'onChange'>;
  tabs?: Omit<TabsConfig, 'label' | 'items' | 'value' | 'defaultValue' | 'onChange'>;
  otp?: Omit<OtpConfig, 'label' | 'value' | 'defaultValue' | 'onChange' | 'onComplete' | 'onPaste' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onValidate' | 'onInvalid'>;
  number?: Omit<NumberFieldConfig, 'label' | 'value' | 'defaultValue' | 'onChange' | 'onValueCommit' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onValidate' | 'onInvalid'>;
  slider?: Omit<SliderConfig, 'label' | 'value' | 'defaultValue' | 'onChange' | 'onChangeEnd' | 'onValueCommit' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onValidate' | 'onInvalid'>;
  toolbar?: Omit<ToolbarConfig, 'label' | 'items'>;
  toggle?: Omit<ToggleConfig, 'label' | 'items' | 'value' | 'defaultValue' | 'pressed' | 'defaultPressed' | 'onChange'>;
  switch?: Omit<SwitchConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'checked' | 'defaultChecked' | 'formValue' | 'onChange' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onValidate' | 'onInvalid'>;
  radio?: Omit<RadioConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'items' | 'value' | 'defaultValue' | 'onChange' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onValidate' | 'onInvalid'>;
  checkbox?: Omit<CheckboxConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'checked' | 'defaultChecked' | 'indeterminate' | 'formValue' | 'onChange' | 'items' | 'value' | 'defaultValue' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onValidate' | 'onInvalid'>;
  input?: Omit<InputConfig, 'label' | 'description' | 'error' | 'invalid' | 'required' | 'disabled' | 'name' | 'id' | 'value' | 'defaultValue' | 'onChange' | 'placeholder' | 'onEnter' | 'onClear' | 'onFocus' | 'onBlur' | 'onKeyDown' | 'onValidate' | 'onInvalid'>;
  toast?: Omit<ToastConfig, 'store'>;
  menu?: Omit<MenuConfig, 'items' | 'trigger' | 'open' | 'defaultOpen' | 'onOpenChange' | 'label' | 'header' | 'footer' | 'value' | 'defaultValue' | 'onValueChange' | 'onAction' | 'onSearchChange' | 'loading' | 'emptyContent' | 'renderItem' | 'filter'>;
  dialog?: Omit<DialogConfig, 'title' | 'description' | 'content' | 'header' | 'footer' | 'actions' | 'trigger' | 'open' | 'defaultOpen' | 'onOpenChange' | 'onOpen' | 'onClose' | 'initialFocus'>;
  popover?: Omit<PopoverConfig, 'title' | 'description' | 'content' | 'header' | 'footer' | 'actions' | 'trigger' | 'open' | 'defaultOpen' | 'onOpenChange' | 'onOpen' | 'onClose'>;
  tooltip?: Omit<TooltipConfig, 'content' | 'trigger' | 'open' | 'defaultOpen' | 'onOpenChange'>;
  progress?: Omit<ProgressConfig, 'value' | 'label' | 'buffer' | 'description' | 'onComplete'>;
  card?: Omit<CardConfig, 'title' | 'description' | 'content' | 'image' | 'actions' | 'href' | 'target' | 'rel' | 'eyebrow' | 'subtitle' | 'avatar' | 'headerAction' | 'footer' | 'media' | 'badge' | 'ribbon' | 'label' | 'onPress' | 'selected' | 'defaultSelected' | 'onSelectedChange' | 'name' | 'value' | 'onAction'>;
  avatar?: Omit<AvatarConfig, 'name' | 'src' | 'alt' | 'initials' | 'status' | 'items' | 'label' | 'colorFrom' | 'href' | 'onClick' | 'onLoadingStatusChange'>;
  alert?: Omit<AlertConfig, 'title' | 'description' | 'actions' | 'onDismiss'>;
}

/**
 * The global config, usually in `pinfold.config.ts` (or `.js`):
 *
 *   export default defineConfig({ theme: 'system', radius: 'lg', defaults: { accordion: { variant: 'separated' } } });
 *
 * and handed to the provider once: `<PinfoldProvider config={config}>`.
 * Precedence, highest first: component config, `defaults.<component>`, this
 * global theme, the library defaults. A nested provider overrides its section.
 */
export interface PinfoldConfig {
  theme?: PinfoldTheme;
  radius?: PinfoldRadius;
  dir?: PinfoldDir;
  size?: PinfoldSize;
  tone?: PinfoldTone;
  /** Visual style pack (needs `@pinfold/css/packs.css`). Default `'default'`. */
  stylePack?: PinfoldStylePack;
  /** Default code-loading strategy for `/lazy` entries. Default `'auto'`. */
  lazy?: PinfoldLazy;
  /** Disable every component transition, e.g. in tests or on low-power devices. */
  disableAnimation?: boolean;
  /**
   * Your router's push, e.g. `navigate={router.push}`: every Pinfold link (breadcrumbs, pages,
   * link tabs, buttons, cards and menu rows with `href`) then changes page without a reload.
   * A click with a modifier key, or to another tab, stays the browser's.
   */
  navigate?: PinfoldNavigate;
  defaults?: PinfoldComponentDefaults;
}

/** Identity function that types a global config. Safe to call from Server Components. */
export function defineConfig<T extends PinfoldConfig>(config: T): T {
  return config;
}
