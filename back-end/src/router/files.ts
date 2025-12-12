import { Request, Response, Router } from "express";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

type AccessLevel = "owner" | "team" | "link";

type IncomingFileBody = {
  name: string;
  mime?: string;
  ownerId: string;
  access: AccessLevel;
  sharedWith?: string[];
  note?: string;
  data: string; // base64 encoded binary
};

type StoredMeta = {
  id: string;
  storedName: string;
  originalName: string;
  mime: string;
  size: number;
  ownerId: string;
  access: AccessLevel;
  sharedWith: string[];
  note?: string;
  uploadedAt: string;
};

const router = Router();

const UPLOAD_ROOT = path.join(__dirname, "../../data/uploads");
const META_PATH = path.join(UPLOAD_ROOT, "meta.json");
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

async function ensureUploadDir() {
  await fs.promises.mkdir(UPLOAD_ROOT, { recursive: true });
}

async function loadMeta(): Promise<Record<string, StoredMeta>> {
  try {
    const raw = await fs.promises.readFile(META_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

async function saveMeta(meta: Record<string, StoredMeta>) {
  await fs.promises.writeFile(META_PATH, JSON.stringify(meta, null, 2), "utf8");
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as IncomingFileBody;
    if (!payload?.data || !payload.name || !payload.ownerId || !payload.access) {
      res.status(400).json({ error: "name, data, ownerId, access 필수" });
      return;
    }

    const buffer = Buffer.from(payload.data, "base64");
    if (!buffer.length) {
      res.status(400).json({ error: "비어 있는 파일입니다." });
      return;
    }
    if (buffer.length > MAX_BYTES) {
      res.status(413).json({ error: "파일 크기 초과 (50MB 제한)" });
      return;
    }

    await ensureUploadDir();
    const meta = await loadMeta();
    const fileId = uuidv4();
    const safeExt = path.extname(payload.name || "");
    const storedName = `${fileId}${safeExt}`;
    const storedPath = path.join(UPLOAD_ROOT, storedName);

    await fs.promises.writeFile(storedPath, buffer);

    const storedMeta: StoredMeta = {
      id: fileId,
      storedName,
      originalName: payload.name,
      mime: payload.mime || "application/octet-stream",
      size: buffer.length,
      ownerId: payload.ownerId,
      access: payload.access,
      sharedWith: payload.sharedWith ?? [],
      note: payload.note,
      uploadedAt: new Date().toISOString(),
    };

    meta[fileId] = storedMeta;
    await saveMeta(meta);

    res.status(201).json({
      fileId,
      message: "UUID 파일명으로 저장 완료. 메타데이터 기록됨.",
    });
    return;
  } catch (error) {
    console.error("[upload] error", error);
    res.status(500).json({ error: "파일 업로드 실패" });
  }
});

router.get("/:fileId", async (req: Request, res: Response): Promise<void> => {
  const { fileId } = req.params;
  const viewerId =
    (req.headers["x-viewer-id"] as string) ||
    (req.query.viewerId as string) ||
    "";

  try {
    await ensureUploadDir();
    const meta = await loadMeta();
    const fileMeta = meta[fileId];
    if (!fileMeta) {
      res.status(404).json({ error: "파일 메타데이터를 찾을 수 없습니다." });
      return;
    }

    const canAccess = (() => {
      if (fileMeta.access === "owner") return fileMeta.ownerId === viewerId;
      if (fileMeta.access === "team") {
        return (
          fileMeta.ownerId === viewerId ||
          fileMeta.sharedWith?.includes(viewerId)
        );
      }
      return true;
    })();

    if (!canAccess) {
      res
        .status(403)
        .json({ error: "접근 거부: 소유자 또는 공유 대상만 다운로드 가능" });
      return;
    }

    const storedPath = path.join(UPLOAD_ROOT, fileMeta.storedName);
    const exists = await fs.promises
      .stat(storedPath)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      res.status(404).json({ error: "저장된 파일이 없습니다." });
      return;
    }

    res.setHeader("Content-Type", fileMeta.mime);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileMeta.originalName)}"`
    );
    res.sendFile(storedPath);
    return;
  } catch (error) {
    console.error("[download] error", error);
    res.status(500).json({ error: "파일 전송 실패" });
  }
});

export default router;
