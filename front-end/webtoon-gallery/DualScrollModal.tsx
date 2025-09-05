import { t_lang_code } from "@allType";
import React from "react";
import ReactModal from "react-modal";
import LazyImage from "./LazyImage";
import "./modal.scss";
import { AppClass } from "./WebtoonGallery";

/** 한쪽 패널에 보여줄 이미지 목록 */
export type Pane = {
  title: string; // 패널 상단 라벨 (예: "번역 전", "번역 후")
  images: string[]; // 세로로 이어 붙일 이미지 경로들
  altPrefix?: string; // 접근성용 대체텍스트 접두사
};

type DualScrollModalProps = {
  isOpen: boolean;
  onRequestClose: () => void; // 동작은 네가 구현
  left: Pane;
  right: Pane;
  lv_Obj: AppClass;
  /** 포털 a11y. 실제 앱에선 setAppElement 사용 권장 */
  ariaHideApp?: boolean;
};

const DualScrollModal: React.FC<DualScrollModalProps> = ({
  isOpen,
  onRequestClose,
  left,
  right,
  ariaHideApp = false,
  lv_Obj,
}) => {
  const w = lv_Obj.pt_toonMain.select_w;

  const langJson = lv_Obj.pt_lang_select.lang_json;
  if (w === undefined) return <></>;
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      ariaHideApp={ariaHideApp}
      shouldCloseOnEsc={true}
      shouldCloseOnOverlayClick={true}
      overlayClassName={`ptj-modal__overlay ${
        isOpen
          ? "ptj-modal__overlay--after-open"
          : "ptj-modal__overlay--before-close"
      }`}
      className={`ptj-modal ${
        isOpen ? "ptj-modal--after-open" : "ptj-modal--before-close"
      }`}
      contentLabel="번역 전/후 동시 스크롤 뷰어"
    >
      {/* 헤더 */}
      <header className="ptj-modal__header">
        <div className="ptj-modal__title">
          <strong>스크롤 뷰어</strong>
          <span>Webtoon Compare</span>
        </div>

        {/* 툴바 (동작은 바인딩하지 않음) */}
        <div
          className="ptj-modal__toolbar"
          role="toolbar"
          aria-label="보기 옵션"
        >
          {w.platform.split("#").map((e) => {
            return (
              <button
                key={e + w.id + "modal"}
                className="ptj-btn"
                type="button"
                onClick={() => {
                  lv_Obj.pt_toonMain.im_id(w, e as t_lang_code);
                }}
                data-action="fit-width"
              >
                {langJson[e as t_lang_code]?.lang_name}
              </button>
            );
          })}

          <button
            style={{ opacity: 0 }}
            className="ptj-btn"
            type="button"
            data-action="fit-height"
          >
            AAAA
          </button>
          <button
            className="ptj-btn ptj-btn--danger"
            type="button"
            onClick={onRequestClose}
            data-action="close"
            aria-label="닫기"
          >
            닫기
          </button>
        </div>
      </header>

      {/* 바디: 좌/우 동시 스크롤 영역 */}
      <div className="ptj-modal__body">
        {/* 왼쪽(번역 전) */}
        <section
          className="ptj-pane"
          data-pane="left"
          data-sync-group="webtoon"
          data-fit="width"
          aria-label={`${left.title} 패널`}
        >
          <div className="ptj-pane__bar">
            <span className="ptj-chip ptj-chip--left">{left.title}</span>
          </div>
          <div className="ptj-strip" data-sync-scroll>
            {left.images.map((src, i) => (              
              <LazyImage
              key={src + i+'left'}
              src={"/data" + src}
              alt={`${left.altPrefix ?? left.title} 이미지 ${i + 1}`}
              className="ptj-strip__img"
              // width={1080} height={1920}  // 알면 넣어(레이아웃 시프트 최소화)
            />
            ))}
          </div>
        </section>

        {/* 오른쪽(번역 후) */}
        <section
          className="ptj-pane"
          data-pane="right"
          data-sync-group="webtoon"
          data-fit="width"
          aria-label={`${right.title} 패널`}
        >
          <div className="ptj-pane__bar">
            <span className="ptj-chip ptj-chip--right">{right.title}</span>
          </div>
          <div className="ptj-strip" data-sync-scroll>
            {right.images.map((src, i) => (
              <LazyImage
                key={src + i+'right'}
                src={"/data" + src}
                alt={`${right.altPrefix ?? right.title} 이미지 ${i + 1}`}
                className="ptj-strip__img"
                // width={1080} height={1920}  // 알면 넣어(레이아웃 시프트 최소화)
              />
            ))}
          </div>
        </section>
      </div>
    </ReactModal>
  );
};

export default DualScrollModal;
