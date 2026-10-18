import { useRef } from 'react'
import { Frame, Title } from '../session/Shell'
import './subject.css'

// The menu every subject opens on: chapters, then topics. Topics not built yet stay on the
// menu as "coming next" so the whole map of the subject is visible (same look as orgo's).

export type MenuTopic = { id: string; title: string; blurb: string; ready: boolean }
export type MenuSection<T extends MenuTopic = MenuTopic> = { id: string; title: string; blurb: string; topics: T[] }

export function SubjectMenu<T extends MenuTopic>({ subject, className, sections, onPick }: { subject: string; className: string; sections: MenuSection<T>[]; onPick: (t: T) => void }) {
  const title = useRef<HTMLHeadingElement>(null)
  return (
    <Frame className={`subject ${className}`}>
      <div className="ss-head">
        <span className="ss-chip">{subject}</span>
      </div>
      <Title h="What do you want to practice?" sub="Pick a chapter, then a topic." headingRef={title} />
      <div className="sj-menu">
        {sections.map((s) => (
          <section key={s.id} aria-labelledby={`sj-sec-${s.id}`}>
            <h3 id={`sj-sec-${s.id}`} className="sj-sec-title">{s.title}</h3>
            <p className="sj-sec-blurb">{s.blurb}</p>
            <div className="sj-topics">
              {s.topics.map((t) => (
                <button key={t.id} className="sj-topic" disabled={!t.ready} onClick={() => onPick(t)} aria-describedby={`sj-t-${t.id}`}>
                  <span className="sj-topic-title">{t.title}</span>
                  <span id={`sj-t-${t.id}`} className="sj-topic-blurb">{t.blurb}</span>
                  {!t.ready && <span className="sj-soon">coming next</span>}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Frame>
  )
}

/** "← All <subject> topics", above a topic's title. */
export function BackToTopics({ subject, onClick }: { subject: string; onClick: () => void }) {
  return (
    <button className="sj-btn sj-ghost sj-back" onClick={onClick}>
      ← All {subject.toLowerCase()} topics
    </button>
  )
}

/** A row of answer cards with ✗ on the ones already tried. */
export function Choices<C extends string>({ choices, wrong, done, onPick, label }: { choices: { id: C; text: string; sub?: string }[]; wrong: C[]; done?: boolean; onPick: (c: C) => void; label: string }) {
  return (
    <div className="sj-choices" role="group" aria-label={label}>
      {choices.map((c) => (
        <button key={c.id} className={'sj-choice' + (wrong.includes(c.id) ? ' wrong' : '')} disabled={done || wrong.includes(c.id)} onClick={() => onPick(c.id)}>
          <b>
            {wrong.includes(c.id) && <span className="sj-mark" aria-hidden="true">✗</span>}
            {c.text}
          </b>
          {c.sub && <span>{c.sub}</span>}
        </button>
      ))}
    </div>
  )
}

/** The verdict under a question: green ✓ Correct! with the reason, or ✗ Not quite with why. */
export function Verdict({ right, label, line }: { right: boolean; label?: string; line: string }) {
  return right ? (
    <p className="sj-correct" role="status">
      <span className="sj-check" aria-hidden="true">✓</span>
      <span><b>Correct!</b> {line}</span>
    </p>
  ) : (
    <p className="sj-wrong" role="status">
      <b>✗ Not quite.</b> {label && <span className="sj-mname">{label}</span>} {line}
    </p>
  )
}
