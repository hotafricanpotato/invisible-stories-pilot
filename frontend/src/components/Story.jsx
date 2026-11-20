import { Paragraphs } from "./UI";
import StorySequence from "./StorySequence";
import { sceneFragments } from "../content/storyRegistry.js";
export function Photo({ art, compact = false }) {
  if (!art) return null;
  return (
    <figure className={`archive-photo ${compact ? "compact-photo" : ""}`}>
      <img
        src={art.src}
        alt={art.alt ?? `Художественная реконструкция: ${art.label}`}
        width={art.width}
        height={art.height}
      />
      <figcaption>
        <span>{art.label}</span>
        <span>Художественная реконструкция</span>
      </figcaption>
    </figure>
  );
}
export function Monologue({ text }) {
  return (
    <aside className="monologue">
      <div className="eyebrow">ВНУТРЕННИЙ МОНОЛОГ</div>
      <Paragraphs text={text} />
    </aside>
  );
}
export function Message({ message, character }) {
  return message.type === "narration" ? (
    <p className="narration">{message.text}</p>
  ) : (
    <div
      className={`message-row ${message.sender === character ? "mine" : ""}`}
    >
      <div className="bubble">
        <span className="sender">{message.sender}</span>
        <p>{message.text}</p>
        {message.time && <time>{message.time}</time>}
      </div>
    </div>
  );
}
export function Chat({ messages, title, character }) {
  return (
    <div className="chat">
      {title && (
        <>
          <div className="eyebrow">СООБЩЕНИЯ</div>
          <p className="chat-title">{title}</p>
        </>
      )}
      {messages.map((m, i) => (
        <Message key={i} message={m} character={character} />
      ))}
    </div>
  );
}
function Fragment({ part, character }) {
  if (part.kind === "message")
    return <Message message={part.message} character={character} />;
  if (part.kind === "monologue") return <Monologue text={part.text} />;
  return <p className="narration">{part.text}</p>;
}
export function Scene({ scene, story, visible, onReveal }) {
  const parts = sceneFragments(scene).slice(0, visible);
  const presentation = story.presentation;
  return (
    <>
      <h1>{scene.title}</h1>
      {scene.time && <p className="caption">{scene.time}</p>}
      <StorySequence
        visible={visible}
        total={sceneFragments(scene).length}
        onReveal={onReveal}
      >
        {scene.type === "messages" ? (
          <>
            <div className="messages-layout">
              <Photo art={presentation.artwork?.[scene.id]} compact />
              <div className="chat-panel">
                <Chat
                  title={scene.chatTitle ?? presentation.chatTitle}
                  messages={parts
                    .filter((p) => p.kind === "message")
                    .map((p) => p.message)}
                  character={story.character}
                />
              </div>
            </div>
            <div className="reading">
              {parts
                .filter((p) => p.kind !== "message")
                .map((part, i) => (
                  <Fragment key={i} part={part} character={story.character} />
                ))}
            </div>
          </>
        ) : (
          <>
            <Photo art={presentation.artwork?.[scene.id]} />
            <div className="reading">
              {scene.messages && (
                <>
                  <div className="eyebrow">СООБЩЕНИЯ</div>
                  <p className="chat-title">Уведомление</p>
                </>
              )}
              {parts.map((part, i) => (
                <Fragment key={i} part={part} character={story.character} />
              ))}
            </div>
          </>
        )}
      </StorySequence>
    </>
  );
}
export function MaterialContent({ material: m, story }) {
  const p = story.presentation;
  return (
    <div className="material-content">
      {m.type === "chat" && (
        <Chat
          messages={m.messages}
          title={m.chatTitle ?? p.chatTitle}
          character={story.character}
        />
      )}
      {m.type === "note" && (
        <div className="phone-note">
          <div className="eyebrow">{m.label ?? p.noteLabel}</div>
          <ul>
            {m.items.map((x) => (
              <li key={x}>
                <span aria-hidden="true">□</span>
                {x}
              </li>
            ))}
          </ul>
          <strong className="warning">{m.highlight}</strong>
        </div>
      )}
      {m.type === "voice" && (
        <div className="voice">
          <div className="eyebrow">{m.label ?? p.voiceLabel}</div>
          <div className="wave" aria-hidden="true">
            {[
              9, 18, 28, 14, 31, 20, 11, 26, 34, 16, 22, 12, 29, 18, 35, 15, 25,
              12, 20, 10,
            ].map((h, i) => (
              <i key={i} style={{ height: h }} />
            ))}
          </div>
          <div className="eyebrow">РАСШИФРОВКА</div>
          <p>{m.transcript}</p>
          <p className="deleted">{m.status}</p>
        </div>
      )}
      {m.monologue && <Monologue text={m.monologue} />}
    </div>
  );
}
