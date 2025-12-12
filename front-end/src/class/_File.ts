export class _File {
  private readonly iv_forceRender?: () => void;
  constructor(forceRender?: () => void) {
    this.iv_forceRender = forceRender;
  }
}
