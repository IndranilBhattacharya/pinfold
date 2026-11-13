import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describePinfoldConformance } from '@pinfold/testing';
import { cardMeta } from '@pinfold/core/meta';
import { Card } from './Card';
import { useCard } from './useCard';
import { defineCard } from './define';
import { cardHoverEffect, cardInteraction, cardMediaPosition, inactiveCardOptions } from '@pinfold/core';
import type { CardComponent, CardConfig } from './types';

const root = (c: HTMLElement) => c.querySelector('.pinfold-card') as HTMLElement;

describe('Card', () => {
  it('has a real heading at the chosen level', () => {
    const { rerender } = render(<Card title="Pro" description="For teams" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Pro' })).toBeTruthy();
    rerender(<Card title="Pro" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Pro' })).toBeTruthy();
  });

  it('a linked card is read as its title alone, with safe rel', () => {
    render(<Card title="Release notes" description="What changed in 2.0" href="https://example.com" target="_blank" actions={[{ label: 'Share' }]} />);
    const link = screen.getByRole('link');
    expect(link.textContent).toBe('Release notes');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
  });

  it('needs a title to be a link', () => {
    const { container } = render(<Card description="x" href="/x" />);
    expect(container.querySelector('a')).toBeNull();
    expect(root(container).hasAttribute('data-link')).toBe(false);
  });

  it('renders actions: first solid, the rest outline; an action config wins', () => {
    const go = vi.fn();
    const { container } = render(<Card title="x" actions={[{ label: 'Upgrade', onClick: go }, { label: 'Compare' }, { label: 'Later', variant: 'ghost' }]} />);
    expect(Array.from(container.querySelectorAll('.pinfold-button')).map((b) => b.getAttribute('data-variant'))).toEqual(['solid', 'outline', 'ghost']);
    fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }));
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('renders an image with its alt, and the chosen root element', () => {
    const { container } = render(
      <ul>
        <Card as="li" title="x" image={{ src: '/a.png', alt: 'A mountain' }} orientation="horizontal" />
      </ul>,
    );
    expect(root(container).tagName).toBe('LI');
    expect(screen.getByRole('img', { name: 'A mountain' })).toBeTruthy();
    expect(root(container).getAttribute('data-orientation')).toBe('horizontal');
  });

  it('header: avatar, eyebrow, title, subtitle and a header action; footer before the actions', () => {
    const { container } = render(<Card avatar={<i data-testid="av" />} eyebrow="Revenue" title="$48,210" subtitle="This month" headerAction={<button>Menu</button>} footer="vs. last month" actions={[{ label: 'Open' }]} />);
    const header = root(container).querySelector('.pinfold-card__header')!;
    expect(header.querySelector('.pinfold-card__avatar [data-testid="av"]')).toBeTruthy();
    expect(Array.from(header.querySelector('.pinfold-card__heading')!.children).map((c) => c.className)).toEqual(['pinfold-card__eyebrow', 'pinfold-card__title', 'pinfold-card__subtitle']);
    expect(header.querySelector('.pinfold-card__headerAction button')).toBeTruthy();
    const footer = root(container).querySelector('.pinfold-card__footer')!;
    expect(footer.textContent).toBe('vs. last monthOpen');
  });

  it('title and description take a function of the live state; children are the content', () => {
    const { container } = render(<Card title={(s) => `variant ${s.variant}`} description={(s) => (s.loading ? 'wait' : 'ready')}>body</Card>);
    expect(screen.getByRole('heading').textContent).toBe('variant outline');
    expect(root(container).querySelector('.pinfold-card__description')!.textContent).toBe('ready');
    expect(root(container).querySelector('.pinfold-card__content')!.textContent).toBe('body');
  });

  it('media: any node, a position, a ratio; start and end make it horizontal, cover lays the text over it', () => {
    const { container, rerender } = render(<Card title="x" media={<video data-testid="v" />} mediaPosition="end" mediaRatio="16 / 9" />);
    expect(root(container).querySelector('.pinfold-card__media video')).toBeTruthy();
    expect(root(container).getAttribute('data-media-position')).toBe('end');
    expect(root(container).getAttribute('data-orientation')).toBe('horizontal');
    expect(root(container).lastElementChild!.classList.contains('pinfold-card__media')).toBe(true);
    expect(root(container).style.getPropertyValue('--pinfold-crd-ratio')).toBe('16 / 9');
    rerender(<Card title="x" image={{ src: '/a.png', alt: '' }} mediaPosition="cover" scrim="full" />);
    expect(root(container).getAttribute('data-orientation')).toBe('vertical');
    expect(root(container).getAttribute('data-scrim')).toBe('full');
    rerender(<Card title="x" image={{ src: '/a.png', alt: '' }} orientation="horizontal" />);
    expect(root(container).getAttribute('data-media-position')).toBe('start');
  });

  it('pressable: the title is a button whose hit area covers the card; nested buttons stay separate', () => {
    const onPress = vi.fn();
    const onAction = vi.fn();
    const own = vi.fn();
    render(<Card title="Trip" onPress={onPress} actions={[{ label: 'Save', onClick: own }]} onAction={onAction} />);
    const press = screen.getByRole('button', { name: 'Trip' });
    expect(press.closest('h3')).toBeTruthy();
    expect(press.getAttribute('type')).toBe('button');
    fireEvent.click(press);
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(own).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ label: 'Save' }), 0, expect.anything());
  });

  it('a card with no title is pressed or linked through a control named by label', () => {
    const onPress = vi.fn();
    const { rerender } = render(<Card image={{ src: '/a.png', alt: '' }} pressable onPress={onPress} label="Open the photo" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open the photo' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    rerender(<Card image={{ src: '/a.png', alt: '' }} href="/photo" label="Open the photo" />);
    expect(screen.getByRole('link', { name: 'Open the photo' }).getAttribute('href')).toBe('/photo');
  });

  it('disabled blocks the press and the link, and stays focusable', () => {
    const onPress = vi.fn();
    const { container, rerender } = render(<Card title="x" onPress={onPress} disabled actions={[{ label: 'A' }]} />);
    const press = screen.getByRole('button', { name: 'x' });
    expect(press.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(press);
    expect(onPress).not.toHaveBeenCalled();
    expect(root(container).hasAttribute('data-disabled')).toBe(true);
    expect(root(container).getAttribute('data-hover-effect')).toBe('none');
    expect(screen.getByRole('button', { name: 'A' }).getAttribute('aria-disabled')).toBe('true');
    rerender(<Card title="x" href="/x" disabled />);
    const link = screen.getByRole('link', { name: 'x' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('tabindex')).toBe('0');
  });

  it('selectable: a native checkbox labelled by the title, uncontrolled and controlled', () => {
    const onChange = vi.fn();
    let ctrl: CardComponent | null = null;
    function Host(props: CardConfig) {
      const C = useCard(props);
      ctrl = C;
      return <C />;
    }
    const { container, rerender } = render(<Host selectable title="Pro" description="For teams" onSelectedChange={onChange} name="plan" value="pro" />);
    const box = screen.getByRole('checkbox', { name: 'Pro' });
    expect(box.getAttribute('aria-describedby')).toBe(root(container).querySelector('.pinfold-card__description')!.id);
    expect(box.getAttribute('name')).toBe('plan');
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(root(container).hasAttribute('data-selected')).toBe(true);
    expect(ctrl!.selected).toBe(true);
    rerender(<Host selectable title="Pro" selected={false} onSelectedChange={onChange} />);
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenLastCalledWith(true, expect.anything());
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    act(() => ctrl!.setSelected(true));
  });

  it('radio cards sharing a name form one group', () => {
    render(
      <>
        <Card selectable="radio" name="plan" value="a" title="A" defaultSelected />
        <Card selectable="radio" name="plan" value="b" title="B" disabled />
      </>,
    );
    const [a, b] = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(a.checked).toBe(true);
    expect(b.disabled).toBe(true);
    expect(document.querySelectorAll('.pinfold-card__indicator[data-type="radio"]')).toHaveLength(2);
  });

  it('loading shows placeholder bars with aria-busy instead of the text', () => {
    const { container } = render(<Card title="x" description="y" image={{ src: '/a.png', alt: 'A' }} loading />);
    expect(root(container).getAttribute('aria-busy')).toBe('true');
    expect(root(container).querySelector('.pinfold-card__placeholder')!.getAttribute('aria-hidden')).toBe('true');
    expect(root(container).querySelector('h3')).toBeNull();
    expect(root(container).querySelector('img')).toBeNull();
  });

  it('badge, ribbon, dividers, actions alignment and hover effects reach the DOM', () => {
    const { container } = render(<Card title="x" badge="New" ribbon="Popular" dividers actionsAlign="stretch" actions={[{ label: 'Go' }]} hoverEffect="glow" variant="glass" tone="success" />);
    const el = root(container);
    expect(el.querySelector('.pinfold-card__badge')!.textContent).toBe('New');
    expect(el.querySelector('.pinfold-card__ribbon')!.textContent).toBe('Popular');
    expect(el.hasAttribute('data-dividers')).toBe(true);
    expect(el.getAttribute('data-actions-align')).toBe('stretch');
    expect(el.getAttribute('data-hover-effect')).toBe('glow');
    expect(el.getAttribute('data-variant')).toBe('glass');
    expect(el.getAttribute('data-tone')).toBe('success');
    expect(el.querySelector('.pinfold-button')!.hasAttribute('data-full-width')).toBe(true);
  });

  it('rules: media position, interaction, hover and inactive options', () => {
    expect(cardMediaPosition({})).toBe('top');
    expect(cardMediaPosition({ orientation: 'horizontal' })).toBe('start');
    expect(cardMediaPosition({ orientation: 'horizontal', mediaPosition: 'cover' })).toBe('cover');
    expect(cardInteraction({ title: 'x', href: '/x', onPress: () => {} })).toBe('link');
    expect(cardInteraction({ title: 'x', selectable: true, href: '/x' })).toBe('checkbox');
    expect(cardInteraction({ pressable: true })).toBe('none');
    expect(cardHoverEffect({ title: 'x', pressable: true })).toBe('lift');
    expect(cardHoverEffect({ title: 'x' })).toBe('none');
    expect(Object.keys(inactiveCardOptions({ title: 'x' }))).toEqual(['target', 'rel', 'selected', 'defaultSelected', 'onSelectedChange', 'name', 'value', 'orientation', 'mediaPosition', 'mediaRatio', 'scrim', 'actionsAlign', 'onAction']);
    expect(inactiveCardOptions({ pressable: true }).pressable).toBeTruthy();
  });

  it('a preset renders on the server', () => {
    const Plan = defineCard({ variant: 'elevated', as: 'article' });
    const html = renderToString(<Plan title="Pro" content={<b>$29</b>} />);
    expect(html).toContain('<article');
    expect(html).toContain('data-variant="elevated"');
  });
});

describePinfoldConformance({
  name: 'card',
  inherits: [],
  slots: ['root', 'media', 'image', 'body', 'header', 'avatar', 'eyebrow', 'title', 'subtitle', 'headerAction', 'description', 'content', 'footer', 'actions', 'badge', 'ribbon', 'select', 'indicator', 'placeholder'],
  optionalSlots: ['placeholder', 'select', 'indicator'],
  dimension: { key: 'padding', value: 12 },
  cssFile: 'packages/css/src/card.css',
  meta: cardMeta,
  preset: { define: defineCard as any, props: { title: 'Pro' } },
  hook: { use: useCard as any, config: { title: 'Pro' } },
  render: (config) => (
    <Card title="Pro" eyebrow="Plan" subtitle="Monthly" avatar={<i />} headerAction={<i />} description="For teams" content="$29" footer="Billed monthly" badge="New" ribbon="Popular" image={{ src: '/a.png', alt: '' }} actions={[{ label: 'Upgrade' }]} {...config} />
  ),
});

describe('Card: radio groups stay in step', () => {
  it('an uncontrolled radio card clears its selected state when another card in its group is chosen', () => {
    const { container } = render(
      <>
        <Card title="Free" selectable="radio" name="plan" value="free" defaultSelected />
        <Card title="Pro" selectable="radio" name="plan" value="pro" />
      </>,
    );
    const [free, pro] = Array.from(container.querySelectorAll('.pinfold-card'));
    expect(free.hasAttribute('data-selected')).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    expect(pro.hasAttribute('data-selected')).toBe(true);
    expect(free.hasAttribute('data-selected')).toBe(false);
  });
});
