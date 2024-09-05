// global.d.ts or window.d.ts

interface Ethereum {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  // Add more types as needed
}

interface Solana {
  isPhantom?: boolean;
  connect: () => Promise<any>;
  disconnect: () => any;
  publicKey: string;
}

interface Window {
  ethereum?: Ethereum;
  solana?: Solana;
}
