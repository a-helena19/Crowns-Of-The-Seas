import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { HELP_CHAPTERS } from "./helpCenterContent";
import type { HelpChapter, HelpPage } from "./helpCenterContent";
import "../style/helpCenter.css";

interface HelpCenterProps {
    open: boolean;
    onClose: () => void;
}

// Eine Seite des Buches kennt ihr Kapitel – so weiß die linke Seite immer,
// welches farbige Kapitelblatt sie zeigen muss.
interface FlatPage {
    chapterIndex: number;
    page: HelpPage;
}

// Alle Seiten aller Kapitel zu einer durchgehenden Liste verketten,
// damit man wie in einem echten Buch von vorne bis hinten durchblättern kann.
function buildFlatPages(chapters: HelpChapter[]): FlatPage[] {
    const pages: FlatPage[] = [];
    for (let c = 0; c < chapters.length; c++) {
        const chapter = chapters[c];
        for (let p = 0; p < chapter.pages.length; p++) {
            pages.push({ chapterIndex: c, page: chapter.pages[p] });
        }
    }
    return pages;
}

// Index der ersten Seite eines Kapitels finden (für die Sprünge per Reiter).
function firstPageOfChapter(flatPages: FlatPage[], chapterIndex: number): number {
    for (let i = 0; i < flatPages.length; i++) {
        if (flatPages[i].chapterIndex === chapterIndex) {
            return i;
        }
    }
    return 0;
}

export default function HelpCenter({ open, onClose }: HelpCenterProps) {
    const flatPages = useMemo(() => buildFlatPages(HELP_CHAPTERS), []);
    const [current, setCurrent] = useState(0);
    // Richtung der letzten Blätter-Bewegung – nur für die Animation.
    const [turn, setTurn] = useState<"none" | "next" | "prev">("none");

    const total = flatPages.length;
    const active = flatPages[current];
    const chapter = HELP_CHAPTERS[active.chapterIndex];

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
        const target = firstPageOfChapter(flatPages, chapterIndex);
        setCurrent((c) => {
            setTurn(target >= c ? "next" : "prev");
            return target;
        });
    }, [flatPages]);

    // Beim Öffnen immer vorne anfangen.
    useEffect(() => {
        if (open) {
            setCurrent(0);
            setTurn("none");
        }
    }, [open]);

    // Tastatur: Esc schließt, Pfeile blättern.
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

    const page = active.page;
    const pageNumberInChapter = current - firstPageOfChapter(flatPages, active.chapterIndex) + 1;

    const overlay = (
        <div className="help-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Kapitänshandbuch">
            <div
                className="help-book"
                style={{ "--chapter-color": chapter.color } as CSSProperties}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="help-close" onClick={onClose} aria-label="Schließen" type="button">
                    <span aria-hidden="true">&#10005;</span>
                </button>

                {/* Linke Seite: Kapitelblatt + Kapitelliste */}
                <div className="help-left">
                    <div className="help-left-head">
                        <div className="help-book-title">Kapitäns&shy;handbuch</div>
                        <div className="help-book-sub">Crowns of the Seas</div>
                    </div>

                    <div className="help-chapter-banner" style={{ background: chapter.color }}>
                        <span className="help-chapter-banner-num">{chapter.numeral}</span>
                        <span className="help-chapter-banner-title">{chapter.title}</span>
                    </div>

                    <nav className="help-chapter-list" aria-label="Kapitel">
                        {HELP_CHAPTERS.map((ch, i) => {
                            const isActive = i === active.chapterIndex;
                            return (
                                <button
                                    key={ch.id}
                                    type="button"
                                    className={`help-chapter-item ${isActive ? "is-active" : ""}`}
                                    style={{ "--tab-color": ch.color } as CSSProperties}
                                    onClick={() => jumpToChapter(i)}
                                >
                                    <span className="help-chapter-tab" />
                                    <span className="help-chapter-num">{ch.numeral}</span>
                                    <span className="help-chapter-text">
                                        <span className="help-chapter-name">{ch.title}</span>
                                        <span className="help-chapter-desc">{ch.subtitle}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Buchrücken in der Mitte */}
                <div className="help-spine" aria-hidden="true" />

                {/* Rechte Seite: aktuelle Buchseite */}
                <div className="help-right">
                    <div key={current} className={`help-page help-turn-${turn}`}>
                        <div className="help-page-eyebrow" style={{ color: chapter.color }}>
                            Kapitel {chapter.numeral} · {chapter.title}
                        </div>
                        <h2 className="help-page-title">{page.title}</h2>

                        <div className="help-page-body">
                            {page.intro && <p className="help-intro">{page.intro}</p>}

                            {page.paragraphs &&
                                page.paragraphs.map((text, i) => <p key={`p-${i}`}>{text}</p>)}

                            {page.bullets && (
                                <ul className="help-bullets">
                                    {page.bullets.map((text, i) => (
                                        <li key={`b-${i}`}>{text}</li>
                                    ))}
                                </ul>
                            )}

                            {page.note && (
                                <div className="help-note" style={{ borderColor: chapter.color }}>
                                    <span className="help-note-label" style={{ color: chapter.color }}>
                                        Tipp
                                    </span>
                                    <span>{page.note}</span>
                                </div>
                            )}

                            {page.images && (
                                <div className={`help-figures ${page.gallery ? "is-gallery" : ""}`}>
                                    {page.images.map((img, i) => (
                                        <figure key={`f-${i}`} className="help-figure">
                                            <img src={img.src} alt={img.caption ?? page.title} loading="lazy" />
                                            {img.caption && <figcaption>{img.caption}</figcaption>}
                                        </figure>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="help-page-foot">
                            <button
                                type="button"
                                className="help-nav-btn"
                                onClick={goPrev}
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
                                onClick={goNext}
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
