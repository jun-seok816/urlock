import { Main } from "@jsLib/class/Main";
import { _File } from "@jsLib/class/_File";
import React, { useMemo, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
type AccessLevel = "owner" | "team" | "link";

type StoredFile = {
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

const seedFiles: StoredFile[] = [
  {
    id: "f-2891",
    name: "사용자_온보딩_가이드.pdf",
    size: 2_100_000,
    type: "application/pdf",
    owner: "junseok",
    access: "team",
    sharedWith: ["design-squad", "reviewer-lee"],
    note: "팀 전용. 서버가 스트리밍해 전달해야 함.",
    uploadedAt: "2024-02-09T08:40:00Z",
  },
  {
    id: "f-2892",
    name: "재무데이터.xlsx",
    size: 4_800_000,
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    owner: "finance-choi",
    access: "owner",
    sharedWith: [],
    note: "임직원 외 접근 금지. 토큰 검증 필수.",
    uploadedAt: "2024-01-28T16:10:00Z",
  },
  {
    id: "f-2893",
    name: "press-kit.zip",
    size: 8_400_000,
    type: "application/zip",
    owner: "marketing-park",
    access: "link",
    sharedWith: [],
    note: "서명 URL + 만료 시간으로만 배포.",
    uploadedAt: "2024-02-01T11:20:00Z",
  },
];

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

function AccessBadge({ level }: { level: AccessLevel }) {
  const label =
    level === "owner"
      ? "소유자 전용"
      : level === "team"
      ? "팀 공유"
      : "서명 링크";
  return <span className={`badge badge-${level}`}>{label}</span>;
}

class VaultAppClass extends Main {
  public readonly file: _File;

  constructor() {
    super();
    this.file = new _File(this.im_forceRender.bind(this));
  }
}

export function VaultApp() {
  const [files, setFiles] = useState<StoredFile[]>(seedFiles);
  const [viewerId, setViewerId] = useState("junseok");
  const [ownerId, setOwnerId] = useState("junseok");
  const [access, setAccess] = useState<AccessLevel>("owner");
  const [note, setNote] = useState(
    "클라이언트는 경로를 알 수 없고, 서버가 읽어 스트리밍"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sharedWith, setSharedWith] = useState("design-squad");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedFileLabel = selectedFile
    ? `${selectedFile.name} · ${formatBytes(selectedFile.size)}`
    : "파일을 끌어놓거나 선택하세요";

  const canAccess = (file: StoredFile) => {
    if (file.access === "owner") return file.owner === viewerId;
    if (file.access === "team") {
      return file.owner === viewerId || file.sharedWith?.includes(viewerId);
    }
    return true; // link
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.warn("업로드할 파일을 먼저 선택하세요.");
      return;
    }
    const newFile: StoredFile = {
      id: `f-${randomId()}`,
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type || "application/octet-stream",
      owner: ownerId || "unknown-user",
      access,
      sharedWith: sharedWith
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      note,
      uploadedAt: new Date().toISOString(),
    };
    setFiles((prev) => [newFile, ...prev]);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success(
      "메타데이터와 함께 저장했습니다. 이제 서버 엔드포인트와 연결해 보세요."
    );
  };

  const handleAccessCheck = (file: StoredFile) => {
    const ok = canAccess(file);
    if (ok) {
      toast.success(
        "권한 확인 완료. 서버에서 파일을 읽어 스트리밍할 수 있습니다."
      );
      return;
    }
    toast.error("권한 부족: 소유자 또는 공유 대상만 접근할 수 있습니다.");
  };

  const handleSignedLink = (file: StoredFile) => {
    toast.info(
      `서명 URL 발급 요청: ${file.name}. 실제 구현 시 만료 시간과 토큰을 포함하세요.`
    );
  };

  const fileCountByAccess = useMemo(() => {
    return files.reduce(
      (acc, file) => {
        acc[file.access] = (acc[file.access] || 0) + 1;
        return acc;
      },
      { owner: 0, team: 0, link: 0 } as Record<AccessLevel, number>
    );
  }, [files]);

  return (
    <main className="page-shell">
      <header className="hero">
        <div className="eyebrow">Portfolio · Secure file delivery</div>
        <h1>
          인증/권한을 거친 후에만
          <br />
          서버가 파일을 읽어 보내는 UI
        </h1>
        <p className="lede">
          업로드 시점에 메타데이터를 기록하고, 파일 경로를 직접 노출하지 않는
          흐름을 포트폴리오로 보여줄 수 있는 샘플입니다.
        </p>
        <div className="hero-stats">
          <div>
            <div className="muted">소유자 전용</div>
            <strong>{fileCountByAccess.owner}개</strong>
          </div>
          <div>
            <div className="muted">팀 공유</div>
            <strong>{fileCountByAccess.team}개</strong>
          </div>
          <div>
            <div className="muted">서명 링크</div>
            <strong>{fileCountByAccess.link}개</strong>
          </div>
        </div>
      </header>

      <div className="grid">
        <section className="panel upload-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">업로드</p>
              <h2>파일 메타데이터 + 권한 설정</h2>
              <p className="muted">
                실제 API를 연결할 때는 DB에 메타데이터를 먼저 저장하고,
                저장소에는 UUID 이름으로 보관하세요.
              </p>
            </div>
            <div className="inline-control">
              <label>현재 사용자</label>
              <select
                value={viewerId}
                onChange={(e) => setViewerId(e.target.value)}
              >
                <option value="junseok">junseok (소유자)</option>
                <option value="reviewer-lee">reviewer-lee</option>
                <option value="design-squad">design-squad</option>
                <option value="guest">guest</option>
              </select>
            </div>
          </div>

          <div className="dropzone">
            <label htmlFor="file-input" className="drop-content">
              <div className="icon-circle">
                <i className="bi bi-cloud-arrow-up"></i>
              </div>
              <div>
                <div className="drop-title">{selectedFileLabel}</div>
                <div className="muted">
                  최대 50MB. 업로드 시 서버에서 바이러스 검사, 확장자
                  화이트리스트 검증을 권장합니다.
                </div>
              </div>
              <div className="hint">클릭해서 파일 선택</div>
            </label>
            <input
              id="file-input"
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
            />
          </div>

          <div className="form-grid">
            <div>
              <label>소유자 ID</label>
              <input
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                placeholder="예: junseok"
              />
            </div>
            <div>
              <label>공유 대상 (쉼표로 구분)</label>
              <input
                value={sharedWith}
                onChange={(e) => setSharedWith(e.target.value)}
                placeholder="예: design-squad, reviewer-lee"
              />
            </div>
            <div className="access-buttons">
              <label>접근 정책</label>
              <div className="chip-row">
                {(["owner", "team", "link"] as AccessLevel[]).map((item) => (
                  <button
                    key={item}
                    className={access === item ? "chip active" : "chip"}
                    onClick={() => setAccess(item)}
                    type="button"
                  >
                    {item === "owner"
                      ? "소유자 전용"
                      : item === "team"
                      ? "팀/공유 대상"
                      : "서명 링크"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label>메모 / 보안 노트</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <div className="actions">
            <button className="primary" onClick={handleUpload} type="button">
              메타데이터와 함께 업로드
            </button>
            <p className="muted">
              실제 구현: 서버는 파일을 임시 저장 → 검증 → UUID로 이동 → DB에
              메타데이터 기록 → fileId를 클라이언트에 응답합니다.
            </p>
          </div>
        </section>

        <section className="panel list-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">파일 접근</p>
              <h2>서버가 인증 후 스트리밍</h2>
              <p className="muted">
                클라이언트는 파일 경로를 알 수 없습니다. 요청 시 fileId로 조회 →
                권한 체크 → 서버가 직접 파일을 읽어 응답합니다.
              </p>
            </div>
          </div>

          <div className="file-list">
            {files.map((file) => (
              <article className="file-row" key={file.id}>
                <div className="file-meta">
                  <div className="file-name">
                    <i className="bi bi-file-earmark-lock"></i>
                    <div>
                      <strong>{file.name}</strong>
                      <div className="muted">
                        {file.owner} · {formatDate(file.uploadedAt)} ·{" "}
                        {formatBytes(file.size)}
                      </div>
                    </div>
                  </div>
                  <div className="file-tags">
                    <AccessBadge level={file.access} />
                    {file.sharedWith?.length ? (
                      <span className="pill">
                        공유 대상: {file.sharedWith.join(", ")}
                      </span>
                    ) : (
                      <span className="pill muted">공유 대상 없음</span>
                    )}
                  </div>
                  {file.note ? <p className="note">{file.note}</p> : null}
                </div>
                <div className="file-actions">
                  <button
                    className="ghost"
                    onClick={() => handleAccessCheck(file)}
                    type="button"
                  >
                    <i className="bi bi-shield-check"></i> 권한 검사
                  </button>
                  <button
                    className="ghost"
                    onClick={() => handleSignedLink(file)}
                    type="button"
                  >
                    <i className="bi bi-link-45deg"></i> 서명 URL 시뮬레이션
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
