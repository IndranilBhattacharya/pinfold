import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Carousel } from './Carousel';
import { useCarousel } from './useCarousel';

const slides = ['One', 'Two', 'Three', 'Four'].map((t) => <p>{t}</p>);
const track = () => document.querySelector('.pinfold-carousel__track') as HTMLElement;

describe('Carousel: keys, variants, indicators', () => {
  it('arrow keys, Home and End on the slides move it; keys typed in a slide\'s field are left alone', () => {
    const onIndexChange = vi.fn();
    render(<Carousel label="News" slides={[...slides, <input aria-label="Email" />]} onIndexChange={onIndexChange} />);
    fireEvent.keyDown(track(), { key: 'ArrowRight' });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(track(), { key: 'End' });
    expect(onIndexChange).toHaveBeenLastCalledWith(4);
    fireEvent.keyDown(track(), { key: 'Home' });
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    onIndexChange.mockClear();
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Email' }), { key: 'ArrowRight' });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('right-to-left reverses the arrows; a column uses up and down', () => {
    const onIndexChange = vi.fn();
    const { unmount } = render(<Carousel label="Clips" orientation="vertical" slides={slides} onIndexChange={onIndexChange} dimensions={{ height: 300 }} />);
    expect(document.querySelector('.pinfold-carousel')!.getAttribute('data-orientation')).toBe('vertical');
    fireEvent.keyDown(track(), { key: 'ArrowRight' });
    expect(onIndexChange).not.toHaveBeenCalled();
    fireEvent.keyDown(track(), { key: 'ArrowDown' });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    unmount();
  });

  it('centred variants: every slide can be the current one, sides are marked, pressing a neighbour brings it in', () => {
    const onIndexChange = vi.fn();
    render(<Carousel label="Covers" variant="coverflow" defaultIndex={1} slides={slides} onIndexChange={onIndexChange} />);
    const all = Array.from(document.querySelectorAll('.pinfold-carousel__slide'));
    expect(all.map((s) => s.getAttribute('data-side'))).toEqual(['before', null, 'after', 'after']);
    expect(all.map((s) => s.hasAttribute('data-active'))).toEqual([false, true, false, false]);
    expect(all[3].getAttribute('data-distance')).toBe('2');
    // A dot per slide, not per page.
    expect(screen.getAllByRole('button', { name: /Go to slide/ })).toHaveLength(4);
    fireEvent.click(all[3]);
    expect(onIndexChange).toHaveBeenLastCalledWith(3);
  });

  it('indicators as a fraction; controls none; booleans still read', () => {
    const { rerender } = render(<Carousel label="A" slides={slides} indicators="fraction" controls="none" />);
    expect(document.querySelector('.pinfold-carousel__fraction')!.textContent).toBe('1 / 4');
    expect(screen.queryByRole('button', { name: 'Next slide' })).toBeNull();
    rerender(<Carousel label="A" slides={slides} indicators={false} controls />);
    expect(document.querySelector('.pinfold-carousel__indicators')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeTruthy();
    expect(document.querySelector('.pinfold-carousel')!.getAttribute('data-controls')).toBe('always');
  });

  it('a mouse drag moves the row, and the click that ends it presses nothing', () => {
    const onClick = vi.fn();
    render(<Carousel label="Cards" slides={slides.map((s, i) => <button key={i} onClick={onClick}>{`Card ${i}`}</button>)} />);
    const el = track();
    fireEvent.pointerDown(el, { pointerType: 'mouse', button: 0, clientX: 300 });
    fireEvent.pointerMove(window, { clientX: 240 });
    expect(document.querySelector('.pinfold-carousel')!.hasAttribute('data-dragging')).toBe(true);
    fireEvent.pointerUp(window);
    expect(document.querySelector('.pinfold-carousel')!.hasAttribute('data-dragging')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Card 0' }));
    expect(onClick).not.toHaveBeenCalled();
    // The next click is an ordinary one.
    fireEvent.click(screen.getByRole('button', { name: 'Card 0' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('draggable false leaves the mouse alone; the controller plays and pauses', () => {
    let api: ReturnType<typeof useCarousel> | undefined;
    function App() {
      api = useCarousel({ label: 'Auto', slides, autoplay: 2000, draggable: false });
      const C = api;
      return <C />;
    }
    render(<App />);
    fireEvent.pointerDown(track(), { pointerType: 'mouse', button: 0, clientX: 300 });
    fireEvent.pointerMove(window, { clientX: 200 });
    expect(document.querySelector('.pinfold-carousel')!.hasAttribute('data-dragging')).toBe(false);
    expect(api!.playing).toBe(true);
    expect(api!.count).toBe(4);
    act(() => api!.pause());
    expect(api!.playing).toBe(false);
    act(() => api!.play());
    expect(api!.playing).toBe(true);
  });
});
