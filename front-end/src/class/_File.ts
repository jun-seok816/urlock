export type AccessLevel = "owner" | "team" | "link";

export type StoredFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  owner: string;
  access: AccessLevel;
  sharedWith?: string[];
  note?: string;
  uploadedAt: string;
};

export type UploadState = {
  ownerId: string;
  access: AccessLevel;
  note: string;
  selectedFile: File | null;
  sharedWith: string;
};

export type FileInitOptions = {
  files?: StoredFile[];
  upload?: Partial<UploadState>;
};

export class _File {
  private readonly iv_forceRender?: () => void;
  public files: StoredFile[];
  public upload: UploadState;

  constructor(forceRender?: () => void, options?: FileInitOptions) {
    this.iv_forceRender = forceRender;
    this.files = options?.files ?? [];
    this.upload = {
      ownerId: options?.upload?.ownerId ?? "junseok",
      access: options?.upload?.access ?? "owner",
      note: options?.upload?.note ?? "",
      selectedFile: null,
      sharedWith: options?.upload?.sharedWith ?? "",
    };
  }

  public setSelectedFile(file: File | null) {
    this.upload.selectedFile = file;
    this.iv_forceRender?.();
  }

  public updateUpload(patch: Partial<UploadState>) {
    this.upload = { ...this.upload, ...patch };
    this.iv_forceRender?.();
  }

  public addFile(file: StoredFile) {
    this.files = [file, ...this.files];
    this.iv_forceRender?.();
  }
}
