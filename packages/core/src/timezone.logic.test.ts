// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { convertWallTime, formatOffset, hasZone, instantToWall, isTimeZone, timeZoneLabel, timeZones, valueToWall, wallToInstant, wallToValue, zoneOffset } from './timezone.logic';

describe('time zones', () => {
  it('reads a zone\'s offset at an instant, summer and winter', () => {
    expect(zoneOffset(Date.UTC(2026, 0, 15), 'Asia/Kolkata')).toBe(330);
    expect(zoneOffset(Date.UTC(2026, 0, 15), 'America/New_York')).toBe(-300);
    expect(zoneOffset(Date.UTC(2026, 6, 15), 'America/New_York')).toBe(-240);
    expect(zoneOffset(Date.UTC(2026, 6, 15), 'UTC')).toBe(0);
  });

  it('turns a wall time into its instant and back', () => {
    const t = wallToInstant('2026-11-09T14:30', 'Asia/Kolkata');
    expect(new Date(t).toISOString()).toBe('2026-11-09T09:00:00.000Z');
    expect(instantToWall(t, 'Asia/Kolkata')).toBe('2026-11-09T14:30');
    expect(instantToWall('2026-11-09T09:00:00Z', 'Europe/Paris')).toBe('2026-11-09T10:00');
    expect(instantToWall(t, 'America/Los_Angeles', { seconds: true })).toBe('2026-11-09T01:00:00');
    expect(Number.isNaN(wallToInstant('nope', 'UTC'))).toBe(true);
  });

  it('shows the same moment on another clock, across the date line', () => {
    expect(convertWallTime('2026-11-09T14:30', 'Asia/Kolkata', 'Europe/Paris')).toBe('2026-11-09T10:00');
    expect(convertWallTime('2026-11-09T23:30', 'America/Los_Angeles', 'Asia/Tokyo')).toBe('2026-11-10T16:30');
    expect(convertWallTime('2026-11-09T14:30', 'UTC', 'UTC')).toBe('2026-11-09T14:30');
  });

  it('handles daylight saving: a time that never happens moves forward, one that happens twice is the first', () => {
    // New York, 8 March 2026: 02:00 jumps to 03:00.
    expect(new Date(wallToInstant('2026-03-08T02:30', 'America/New_York')).toISOString()).toBe('2026-03-08T07:30:00.000Z');
    expect(instantToWall(wallToInstant('2026-03-08T02:30', 'America/New_York'), 'America/New_York')).toBe('2026-03-08T03:30');
    // New York, 1 November 2026: 01:30 happens twice; the first is still summer time (UTC-4).
    expect(new Date(wallToInstant('2026-11-01T01:30', 'America/New_York')).toISOString()).toBe('2026-11-01T05:30:00.000Z');
    // Either side of a change is exact.
    expect(new Date(wallToInstant('2026-03-08T01:59', 'America/New_York')).toISOString()).toBe('2026-03-08T06:59:00.000Z');
    expect(new Date(wallToInstant('2026-03-08T03:00', 'America/New_York')).toISOString()).toBe('2026-03-08T07:00:00.000Z');
  });

  it('stores a wall time as wall, UTC or with its offset, and reads any of them back', () => {
    expect(wallToValue('2026-11-09T14:30', 'Asia/Kolkata', 'wall')).toBe('2026-11-09T14:30');
    expect(wallToValue('2026-11-09T14:30', 'Asia/Kolkata', 'utc')).toBe('2026-11-09T09:00:00.000Z');
    expect(wallToValue('2026-11-09T14:30', 'Asia/Kolkata', 'offset')).toBe('2026-11-09T14:30:00+05:30');
    expect(wallToValue('2026-11-09T14:30', 'America/New_York', 'offset')).toBe('2026-11-09T14:30:00-05:00');
    // A plain day has no instant: it is never shifted.
    expect(wallToValue('2026-11-09', 'Asia/Kolkata', 'utc')).toBe('2026-11-09');
    expect(valueToWall('2026-11-09T09:00:00.000Z', 'Asia/Kolkata')).toBe('2026-11-09T14:30');
    expect(valueToWall('2026-11-09T14:30:00+05:30', 'Europe/Paris')).toBe('2026-11-09T10:00');
    expect(valueToWall('2026-11-09T14:30', 'Europe/Paris')).toBe('2026-11-09T14:30');
    expect(valueToWall('2026-11-09', 'Europe/Paris')).toBe('2026-11-09');
  });

  it('knows a zone from a typo, formats offsets and lists zones', () => {
    expect(isTimeZone('Europe/Paris')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
    expect(hasZone('2026-11-09T09:00Z')).toBe(true);
    expect(hasZone('2026-11-09T14:30+0530')).toBe(true);
    expect(hasZone('2026-11-09')).toBe(false);
    expect(formatOffset(330)).toBe('+05:30');
    expect(formatOffset(-300)).toBe('-05:00');
    expect(formatOffset(0, true)).toBe('Z');
    expect(timeZones()).toContain('UTC');
    expect(timeZones().length).toBeGreaterThan(10);
    expect(timeZoneLabel('Asia/Kolkata', Date.UTC(2026, 0, 1))).toBe('(GMT+05:30) Asia/Kolkata');
  });
});
