import { Main } from "@jsLib/class/main_class";
import ToonMainAccess from "@jsLib/class/ToonMainAccess";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import "./WebtoonGallery.scss";
import DualScrollModal from "./DualScrollModal";
import { t_lang_code } from "@allType";

export class AppClass extends Main {
  private iv_toonMain: ToonMainAccess;
  constructor() {
    super();
    this.iv_toonMain = new ToonMainAccess(this.im_forceRender.bind(this));
  }

  public get pt_toonMain() {
    return this.iv_toonMain;
  }
}

export default function App() {
  const [lv_Obj] = useState(() => {
    return new AppClass();
  });

  lv_Obj.im_Prepare_Hooks(async () => {
    await lv_Obj.im_getLang();
    lv_Obj.pt_toonMain.im_load();
  });

  const d = lv_Obj.pt_toonMain.pt_data;
  const left = {
    title: "번역 전",
    images: d.t_d
      .filter((e) => e.file_path) // 값 있는 것만
      .map((e) => e.file_path as string), // 키만 뽑기
  };

  const right = {
    title: "번역 후",
    images: d.t_d
      .filter((e) => e.sic_full_path)
      .map((e) => e.sic_full_path as string),
  };
  const langJson = lv_Obj.pt_lang_select.lang_json;
  const lang = lv_Obj.pt_toonMain.iv_selectLang;
  const body = useMemo(() => {
    if (d.loading) return <div className="loading">불러오는 중…</div>;
    if (d.error) return <div className="alert alert--error">{d.error}</div>;
    if (d.works.length === 0)
      return <div className="empty">표시할 작품이 없습니다.</div>;

    return (
      <>
        {(lang === "전체"
          ? d.works
          : d.works.filter((w) => w.platform.includes(lang))
        ).map((w) => (
          <article
            className="asb-card"
            key={w.id}
            onClick={() => lv_Obj.pt_toonMain.im_id(w , w.platform.split("#")[0] as t_lang_code)}
          >
            <section className="card-flex">
              <div
                className="asb-card__media"
                role="img"
                aria-label={`${w.title} 대표 이미지`}
                style={{ backgroundImage: `url(${w.img})` }}
              />
              <div className="asb-card__body">
                <h3 className="asb-card__title">{w.title}</h3>
                <div className="asb-card__meta">
                  {w.platform?.split("#").map((c) => (
                    <span className="asb-tag" key={w.id + c}>
                      {
                        langJson[c.trim().toUpperCase() as t_lang_code]
                          ?.lang_name
                      }{" "}
                      번역
                    </span>
                  ))}{" "}
                </div>
                <dl className="asb-credits">
                  <>
                    <dt>장르</dt>
                    <dd className="asb-credits__desc">{w.category}</dd>
                  </>
                </dl>
                <dl className="asb-credits">
                  {w.desc && (
                    <>
                      <dt>스토리</dt>
                      <dd className="asb-credits__desc">{w.desc}</dd>
                    </>
                  )}
                </dl>
              </div>
            </section>
            <div className="circle">
              <span>→</span>
            </div>
          </article>
        ))}
      </>
    );
  }, [d.loading, d.error, d.works, lang]);

  return (
    <>
      <DualScrollModal
        isOpen={d.modal} // 네가 상태로 제어
        onRequestClose={() => {
          d.modal = false;
          lv_Obj.im_forceRender();
        }} // 닫기 로직 연결
        left={left}
        right={right}
        lv_Obj={lv_Obj}        
      />
      <div className="asb">
        <header className="asb-header">
          <div className="container asb-header__inner">
            <a className="asb-brand" href="#" aria-label="asb COMICS 홈">
              {/* <span className="asb-logo" aria-hidden="true">
                A
              </span> */}
              <span className="asb-brand__text">
                <strong>PORTFOLIO</strong>
                <b>번역공장 웹툰 번역/식자</b>
              </span>
            </a>

            <nav className="asb-nav" aria-label="주요 메뉴">
              <a
                className={`asb-nav__link ${
                  lv_Obj.pt_toonMain.iv_selectLang === "전체" ? "is-active" : ""
                }`}
                onClick={() => {
                  lv_Obj.pt_toonMain.iv_selectLang = "전체";
                  lv_Obj.im_forceRender();
                }}
              >
                전체
              </a>
              <a
                className={`asb-nav__link ${
                  lv_Obj.pt_toonMain.iv_selectLang === "ENG" ? "is-active" : ""
                }`}
                onClick={() => {
                  lv_Obj.pt_toonMain.iv_selectLang = "ENG";
                  lv_Obj.im_forceRender();
                }}
              >
                영어
              </a>
              <a
                className={`asb-nav__link ${
                  lv_Obj.pt_toonMain.iv_selectLang === "JPN" ? "is-active" : ""
                }`}
                onClick={() => {
                  lv_Obj.pt_toonMain.iv_selectLang = "JPN";
                  lv_Obj.im_forceRender();
                }}
              >
                일본어
              </a>
              <a
                className={`asb-nav__link ${
                  lv_Obj.pt_toonMain.iv_selectLang === "CMN" ? "is-active" : ""
                }`}
                onClick={() => {
                  lv_Obj.pt_toonMain.iv_selectLang = "CMN";
                  lv_Obj.im_forceRender();
                }}
              >
                중국어
              </a>
            </nav>
          </div>
        </header>

        <main className="asb-main">
          <section className="asb-subHeader">
            <div>Creporter Corporation</div>
            <span>{lang === "전체" ? lang : langJson[lang]?.lang_name}</span>
          </section>
          <section className="asb-works">
            <div className="container asb-works__grid">{body}</div>
          </section>
        </main>

        <footer className="asb-footer">
          <div className="container">
            <small>
              © {new Date().getFullYear()} COMICS — All rights reserved.
            </small>
          </div>
        </footer>
      </div>
    </>
  );
}
