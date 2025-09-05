import React, { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  // 없으면 최소 높이만 잡음. 있으면 레이아웃 시프트 방지(aspect-ratio)
  width?: number;
  height?: number;
};

export default function LazyImage({ src, alt, className, width, height }: Props) {
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [realSrc, setRealSrc] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  // 뷰포트 진입 감지
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
        }
      },
      { rootMargin: "300px 0px" } // 미리 로드
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 진입 시 src 세팅
  useEffect(() => {
    if (inView && !realSrc) setRealSrc(src);
  }, [inView, realSrc, src]);

  // 실패 시 표시
  const onError = () => {
    setFailed(true);
    setLoaded(false);
  };

  const onLoad = () => setLoaded(true);

  const style: React.CSSProperties = {};
  if (width && height) {
    style.aspectRatio = `${width} / ${height}`;
  } else {
    style.minHeight = 320; // 웹툰 긴컷 대비 기본 높이
  }

  return (
    <div
      ref={ref}
      className={`ptj-lazy ${loaded ? "is-loaded" : ""} ${failed ? "is-failed" : ""}`}
      style={style}
    >
      {!loaded && !failed && <div className="ptj-skeleton" aria-hidden="true" />}

      {realSrc && !failed && (
        <img
          className={className}
          src={realSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={onLoad}
          onError={onError}
          draggable={false}
        />
      )}

      {failed && (
        <div className="ptj-fallback">
          <span>이미지 로딩 실패</span>
        </div>
      )}
    </div>
  );
}
