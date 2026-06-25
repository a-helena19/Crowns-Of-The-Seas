import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { HELP_CHAPTERS } from "./helpCenterContent";
import type { HelpBlock, HelpChapter, HelpPage } from "./helpCenterContent";
import "../style/helpCenter.css";
import audioEngine from "../audio/AudioEngine.ts";
import { requestTutorialRestart } from "./InteractiveTutorial";

interface HelpCenterProps {
    open: boolean;
    onClose: () => void;
    showTutorialRestart?: boolean;
}

interface FlatPage {
    chapterIndex: number;
    pageIndex: number;
    page: HelpPage;
}

function buildFlatPages(chapters: HelpChapter[]): FlatPage[] {
    const pages: FlatPage[] = [];
    for (let c = 0; c < chapters.length; c++) {
        const chapter = chapters[c];
        for (let p = 0; p < chapter.pages.length; p++) {
            pages.push({ chapterIndex: c, pageIndex: p, page: chapter.pages[p] });
        }
    }
    return pages;
}

function firstFlatIndexOfChapter(flatPages: FlatPage[], chapterIndex: number): number {
    for (let i = 0; i < flatPages.length; i++) {
        if (flatPages[i].chapterIndex === chapterIndex) {
            return i;
        }
    }
    return 0;
}

function flatIndexOfPage(flatPages: FlatPage[], chapterIndex: number, pageIndex: number): number {
    for (let i = 0; i < flatPages.length; i++) {
        if (flatPages[i].chapterIndex === chapterIndex && flatPages[i].pageIndex === pageIndex) {
            return i;
        }
    }
    return 0;
}

function renderBlock(block: HelpBlock, index: number, chapterColor: string) {
    switch (block.kind) {
        case "lead":
            return <p key={index} className="help-lead">{block.text}</p>;
        case "text":
            return <p key={index}>{block.text}</p>;
        case "bullets":
            return (
                <ul key={index} className="help-bullets">
                    {block.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            );
        case "tip":
            return (
                <p key={index} className="help-tip">
                    <span className="help-tip-label" style={{ color: chapterColor }}>Tipp:</span>{" "}
                    {block.text}
                </p>
            );
        case "image":
            return (
                <figure key={index} className={`help-figure ${block.align === "wide" ? "is-wide" : "is-side"}`}>
                    <img src={block.src} alt={block.caption ?? ""} loading="lazy" />
                    {block.caption && <figcaption>{block.caption}</figcaption>}
                </figure>
            );
        case "gallery":
            return (
                <div key={index} className="help-gallery">
                    {block.images.map((img, i) => (
                        <figure key={i} className="help-figure is-gallery">
                            <img src={img.src} alt={img.caption ?? ""} loading="lazy" />
                            {img.caption && <figcaption>{img.caption}</figcaption>}
                        </figure>
                    ))}
                </div>
            );
        default:
            return null;
    }
}

export default function HelpCenter({ open, onClose, showTutorialRestart = false }: HelpCenterProps) {
    const flatPages = useMemo(() => buildFlatPages(HELP_CHAPTERS), []);
    const [current, setCurrent] = useState(0);
    const [turn, setTurn] = useState<"none" | "next" | "prev">("none");
    const bodyRef = useRef<HTMLDivElement | null>(null);

    const total = flatPages.length;
    const active = flatPages[current];
    const chapter = HELP_CHAPTERS[active.chapterIndex];
    const page = active.page;

    const goNext = useCallback(() => {
        setCurrent((c) => {
            if (c >= total - 1) {
                return c;
            }
            setTurn("next");
            return c + 1;
        });
    }, [total]);

    const goPrev = useCallback(() => {
        setCurrent((c) => {
            if (c <= 0) {
                return c;
            }
            setTurn("prev");
            return c - 1;
        });
    }, []);

    const jumpToChapter = useCallback((chapterIndex: number) => {
        const target = firstFlatIndexOfChapter(flatPages, chapterIndex);
        setCurrent((c) => {
            setTurn(target >= c ? "next" : "prev");
            return target;
        });
    }, [flatPages]);

    const jumpToPage = useCallback((chapterIndex: number, pageIndex: number) => {
        const target = flatIndexOfPage(flatPages, chapterIndex, pageIndex);
        setCurrent((c) => {
            setTurn(target >= c ? "next" : "prev");
            return target;
        });
    }, [flatPages]);

    useEffect(() => {
        if (open) {
            setCurrent(0);
            setTurn("none");
        }
    }, [open]);

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = 0;
        }
    }, [current]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowRight") {
                goNext();
            } else if (e.key === "ArrowLeft") {
                goPrev();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, goNext, goPrev]);

    if (!open) {
        return null;
    }

    const pageNumberInChapter = active.pageIndex + 1;

    const overlay = (
        <div className="help-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Kapitänshandbuch">
            <div
                className="help-book"
                style={{ "--chapter-color": chapter.color } as CSSProperties}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="help-close" onClick={() => {onClose(); audioEngine.playSfx("buttonClick"); }} aria-label="Schließen" type="button">
                    <span aria-hidden="true">&#10005;</span>
                </button>

                <div className="help-left">
                    <div className="help-left-head">
                        <div className="help-book-title">Kapitäns&shy;handbuch</div>
                        <div className="help-book-sub">Crowns of the Seas</div>
                    </div>

                    {showTutorialRestart && (
                        <button
                            type="button"
                            className="help-tutorial-restart"
                            onClick={() => {
                                audioEngine.playSfx("buttonClick");
                                onClose();
                                requestTutorialRestart();
                            }}
                        >
                            Tutorial erneut starten
                        </button>
                    )}

                    <div className="help-toc-label">Inhalt</div>

                    <nav className="help-toc" aria-label="Inhaltsverzeichnis">
                        {HELP_CHAPTERS.map((ch, i) => {
                            const isActive = i === active.chapterIndex;
                            return (
                                <div key={ch.id} className="help-toc-group">
                                    <button
                                        type="button"
                                        className={`help-toc-chapter ${isActive ? "is-active" : ""}`}
                                        style={{ "--tab-color": ch.color } as CSSProperties}
                                        onClick={() => {jumpToChapter(i); audioEngine.playSfx("buttonClick")}}
                                        aria-expanded={isActive}
                                    >
                                        <span className="help-toc-tab" />
                                        <span className="help-toc-num">{ch.numeral}</span>
                                        <span className="help-toc-text">
                                            <span className="help-toc-name">{ch.title}</span>
                                            <span className="help-toc-desc">{ch.subtitle}</span>
                                        </span>
                                    </button>

                                    {isActive && (
                                        <ul className="help-toc-pages">
                                            {ch.pages.map((pg, p) => (
                                                <li key={pg.id}>
                                                    <button
                                                        type="button"
                                                        className={`help-toc-page ${p === active.pageIndex ? "is-active" : ""}`}
                                                        style={{ "--tab-color": ch.color } as CSSProperties}
                                                        onClick={() => {
                                                            jumpToPage(i, p);
                                                            audioEngine.playSfx("buttonClick");
                                                        }}
                                                    >
                                                        {pg.title}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="help-spine" aria-hidden="true" />

                <div className="help-right">
                    <div key={current} className={`help-page help-turn-${turn}`}>
                        <div className="help-page-eyebrow" style={{ color: chapter.color }}>
                            Kapitel {chapter.numeral} · {chapter.title}
                        </div>
                        <h2 className="help-page-title">{page.title}</h2>

                        <div className="help-page-body" ref={bodyRef}>
                            {page.blocks.map((block, i) => renderBlock(block, i, chapter.color))}
                        </div>

                        <div className="help-page-foot">
                            <button
                                type="button"
                                className="help-nav-btn"
                                onClick={() => {goPrev(); audioEngine.playSfx("buttonClick");}}
                                disabled={current === 0}
                                aria-label="Vorherige Seite"
                            >
                                <span aria-hidden="true">&#8249;</span> Zurück
                            </button>

                            <span className="help-page-count">
                                {chapter.title} · Seite {pageNumberInChapter} von {chapter.pages.length}
                            </span>

                            <button
                                type="button"
                                className="help-nav-btn"
                                onClick={() => {goNext();  audioEngine.playSfx("buttonClick");}}
                                disabled={current === total - 1}
                                aria-label="Nächste Seite"
                            >
                                Weiter <span aria-hidden="true">&#8250;</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(overlay, document.body);
}
