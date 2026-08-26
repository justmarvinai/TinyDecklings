import { beforeEach, describe, expect, it } from 'vitest';
import { activeTab, canPop, currentEntry, currentScreen, useScreenStore } from './screenStore';

const state = () => useScreenStore.getState();

describe('screen stack', () => {
  beforeEach(() => state().reset());

  it('starts on the map with nothing to pop back to', () => {
    expect(currentScreen(state()).kind).toBe('map');
    expect(canPop(state())).toBe(false);
  });

  it('pushes and pops', () => {
    state().push({ kind: 'battle', stage: 3 });
    expect(currentScreen(state())).toEqual({ kind: 'battle', stage: 3 });
    expect(canPop(state())).toBe(true);
    state().pop();
    expect(currentScreen(state()).kind).toBe('map');
  });

  it('never pops the root away', () => {
    state().pop();
    state().pop();
    expect(state().stack).toHaveLength(1);
    expect(currentScreen(state()).kind).toBe('map');
  });

  it('replaces the top entry without growing the stack', () => {
    state().push({ kind: 'cards' });
    state().replace({ kind: 'settings' });
    expect(state().stack).toHaveLength(2);
    expect(currentScreen(state()).kind).toBe('settings');
  });

  it('renders the screen below an open modal but targets the modal for input', () => {
    state().push({ kind: 'cards' });
    state().push({ kind: 'cardDetail', cardUid: 'c1' }, { modal: true });
    expect(currentEntry(state()).modal).toBe(true);
    expect(currentEntry(state()).screen.kind).toBe('cardDetail');
    expect(currentScreen(state()).kind).toBe('cards');
  });

  it('maps pushed screens back to their owning tab', () => {
    state().push({ kind: 'battle', stage: 1 });
    expect(activeTab(state())).toBe('map');
    state().switchTab('cards');
    state().push({ kind: 'cardDetail', cardUid: 'c1' });
    expect(activeTab(state())).toBe('cards');
    state().switchTab('more');
    state().push({ kind: 'settings' });
    expect(activeTab(state())).toBe('more');
  });

  it('switching tabs drops anything stacked above the root', () => {
    state().push({ kind: 'battle', stage: 9 });
    state().switchTab('shop');
    expect(state().stack).toHaveLength(1);
    expect(currentScreen(state()).kind).toBe('shop');
  });
});
