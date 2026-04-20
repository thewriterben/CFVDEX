export const SWAP_PROTOCOL_ID = '/cfvdex/swap/1.0.0';

type SwapMessageType = 'INITIATE' | 'ACCEPT' | 'REVEAL' | 'CLAIM';

export interface SwapMessage {
  swapId: string;
  type: SwapMessageType;
  payload: Record<string, string | number>;
  timestamp: number;
}

export class SwapProtocol {
  constructor(private readonly node: any) {}

  async sendSwapMessage(peerId: string, message: SwapMessage): Promise<void> {
    const encoded = new TextEncoder().encode(JSON.stringify(message));
    const stream = await this.node.dialProtocol(peerId as any, SWAP_PROTOCOL_ID);
    await stream.sink((async function* sinkGenerator(): AsyncGenerator<Uint8Array> {
      yield encoded;
    })());
  }

  async registerHandler(handler: (message: SwapMessage) => Promise<void>): Promise<void> {
    this.node.handle(SWAP_PROTOCOL_ID, async ({ stream }: { stream: any }) => {
      let raw = '';
      for await (const chunk of stream.source) {
        raw += new TextDecoder().decode(chunk.subarray ? chunk.subarray() : chunk);
      }
      await handler(JSON.parse(raw) as SwapMessage);
    });
  }
}
