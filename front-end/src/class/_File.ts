import type React from "react";
import { toast } from "react-toastify";

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
  private iv_fileInputRef?: React.RefObject<HTMLInputElement>;
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

  private randomId() {
    return Math.random().toString(36).slice(2, 9);
  }

  private clearFileInput() {
    if (this.iv_fileInputRef?.current) {
      this.iv_fileInputRef.current.value = "";
    }
  }

  public attachFileInputRef(ref: React.RefObject<HTMLInputElement>) {
    this.iv_fileInputRef = ref;
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

  public handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    this.setSelectedFile(file);
  };

  public handleUpload = () => {
    if (!this.upload.selectedFile) {
      toast.warn("업로드할 파일을 먼저 선택하세요.");
      return;
    }
    const newFile: StoredFile = {
      id: `f-${this.randomId()}`,
      name: this.upload.selectedFile.name,
      size: this.upload.selectedFile.size,
      type: this.upload.selectedFile.type || "application/octet-stream",
      owner: this.upload.ownerId || "unknown-user",
      access: this.upload.access,
      sharedWith: this.upload.sharedWith
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean),
      note: this.upload.note,
      uploadedAt: new Date().toISOString(),
    };
    this.addFile(newFile);
    this.setSelectedFile(null);
    this.clearFileInput();
    toast.success(
      "메타데이터와 함께 저장했습니다. 이제 서버 엔드포인트와 연결해 보세요."
    );
  };

  public handleAccessCheck = (file: StoredFile, viewerId: string) => {
    if (this.canAccess(file, viewerId)) {
      toast.success(
        "권한 확인 완료. 서버에서 파일을 읽어 스트리밍할 수 있습니다."
      );
      return;
    }
    toast.error("권한 부족: 소유자 또는 공유 대상만 접근할 수 있습니다.");
  };

  public handleSignedLink = (file: StoredFile) => {
    toast.info(
      `서명 URL 발급 요청: ${file.name}. 실제 구현 시 만료 시간과 토큰을 포함하세요.`
    );
  };

  private canAccess(file: StoredFile, viewerId: string) {
    if (file.access === "owner") return file.owner === viewerId;
    if (file.access === "team") {
      return file.owner === viewerId || file.sharedWith?.includes(viewerId);
    }
    return true;
  }
}
