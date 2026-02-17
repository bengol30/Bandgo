import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock BroadcastChannel
class BroadcastChannelMock {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  constructor(name: string) { this.name = name; }
  postMessage(_data: unknown) {}
  close() {}
}

Object.defineProperty(globalThis, 'BroadcastChannel', { value: BroadcastChannelMock });

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: (_blob: Blob) => 'blob:mock-url',
});
