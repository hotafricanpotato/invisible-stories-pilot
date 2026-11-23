import { Paragraphs } from "./UI";
import { useEffect } from "react";
import PhotoAlbum from "./materials/PhotoAlbum";
import SceneArtwork from "./story/SceneArtwork";
import LiveDialogue from "./story/LiveDialogue";
import MonologuePanel from "./story/MonologuePanel";
import { sceneFragments, fragmentRange } from "../content/storyRegistry.js";
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
  return <MonologuePanel text={text} />;
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
  if (part.kind === "chat") return <Chat messages={part.messages} title={part.title} character={character} />;
  if (part.kind === "message")
    return <Message message={part.message} character={character} />;
  if (part.kind === "monologue") return <Monologue text={part.text} />;
  return <p className="narration">{part.text}</p>;
}
export function Scene({ scene, story, position, onPosition }) {
  const parts = sceneFragments(scene);
  const range = fragmentRange(scene, position, story.presentation.sceneModes?.[scene.id]);
  // Reading a complete chat marks its source fragments together without reordering them.
  useEffect(() => { onPosition(position); }, [scene.id, position]);
  const current = parts.slice(range.start - 1, range.end);
  return <>
    <h1>{scene.title}</h1>
    {scene.time && <p className="caption">{scene.time}</p>}
    <div className={scene.type === "messages" || current[0]?.kind === "chat" ? "story-chat-layout" : "story-scene-layout"}>
      <SceneArtwork art={story.presentation.artwork?.[scene.id]} />
      <div className="scene-reading" aria-live="polite" aria-atomic="true">
        {scene.type === "messages" ? <>
          <Chat title={scene.chatTitle ?? story.presentation.chatTitle}
            messages={scene.messages} character={story.character} />
          {current.filter(part => part.kind !== "message").map((part, i) =>
            <Fragment key={i} part={part} character={story.character} />)}
        </> : current[0]?.kind === "message" && story.presentation.sceneModes?.[scene.id] === "mixed" ?
          <Chat messages={current.map(part => part.message)} character={story.character} /> :
          current.map((part, i) => part.kind === "message" ?
            <LiveDialogue key={i} message={part.message} /> :
            <Fragment key={i} part={part} character={story.character} />)}
      </div>
    </div>
  </>;
}
export function MaterialContent({ material: m, story }) {
  const p = story.presentation;
  return (
    <div className="material-content">
      {m.time && <p className="caption">{m.time}</p>}
      {m.type === "album" && <PhotoAlbum material={m} artwork={p.materialArtwork?.[m.id]} />}
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
