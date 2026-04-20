declare module 'auto-launch' {
  export default class AutoLaunch {
    constructor(options: { name: string });
    isEnabled(): Promise<boolean>;
    enable(): Promise<void>;
    disable(): Promise<void>;
  }
}
