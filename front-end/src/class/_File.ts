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

type UploadResponse =
  | {
      fileId: string;
      message?: string;
    }
  | { error: string };

export class _File {
  private readonly iv_forceRender?: () => void;
  private iv_fileInputRef?: React.RefObject<HTMLInputElement>;
  public files: StoredFile[];
  public upload: UploadState;
  public uploading: boolean;

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
    this.uploading = false;
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

  private async toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        if (!base64) {
          reject(new Error("base64 변환 실패"));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.readAsDataURL(file);
    });
  }

  private setUploading(flag: boolean) {
    this.uploading = flag;
    this.iv_forceRender?.();
  }

  public handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    this.setSelectedFile(file);
  };

  public handleUpload = async () => {
    if (!this.upload.selectedFile) {
      toast.warn("업로드할 파일을 먼저 선택하세요.");
      return;
    }
    try {
      this.setUploading(true);
      const base64 = await this.toBase64(this.upload.selectedFile);
      const payload = {
        name: this.upload.selectedFile.name,
        mime: this.upload.selectedFile.type || "application/octet-stream",
        ownerId: this.upload.ownerId || "unknown-user",
        access: this.upload.access,
        sharedWith: this.upload.sharedWith
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        note: this.upload.note,
        data: base64,
      };

      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result: UploadResponse = await response.json();
      if (!response.ok || "error" in result) {
        const msg =
          "error" in result
            ? result.error
            : `업로드 실패 (status ${response.status})`;
        toast.error(msg);
        return;
      }

      const newFile: StoredFile = {
        id: result.fileId ?? `f-${this.randomId()}`,
        name: this.upload.selectedFile.name,
        size: this.upload.selectedFile.size,
        type: this.upload.selectedFile.type || "application/octet-stream",
        owner: this.upload.ownerId || "unknown-user",
        access: this.upload.access,
        sharedWith: this.upload.sharedWith
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        note: this.upload.note,
        uploadedAt: new Date().toISOString(),
      };
      this.addFile(newFile);
      this.setSelectedFile(null);
      this.clearFileInput();
      toast.success(result.message ?? "업로드 완료");
    } catch (error: any) {
      toast.error(error?.message || "업로드 중 오류가 발생했습니다.");
    } finally {
      this.setUploading(false);
    }
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
