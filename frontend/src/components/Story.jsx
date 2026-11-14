import { Paragraphs } from "./UI";
const artwork = {
  sunday: ["sunday.jpg", "АРХИВ / ВОСКРЕСЕНЬЕ"],
  messages_dima: ["messages.jpg", "АРХИВ / СООБЩЕНИЯ"],
  keys: ["keys.jpg", "АРХИВ / СРЕДА"],
  football: ["football.jpg", "АРХИВ / ПЯТНИЦА"],
};
export function Photo({ id, compact = false }) {
  const [file, label] = artwork[id];
  return (
    <figure className={`archive-photo ${compact ? "compact-photo" : ""}`}>
      <img
        src={`/assets/nikita/${file}`}
        alt={`Художественная реконструкция: ${label}`}
        width={
          id === "football"
            ? 1122
            : id === "keys"
              ? 602
              : id === "sunday"
                ? 587
                : 582
        }
        height={
          id === "football"
            ? 365
            : id === "keys"
              ? 610
              : id === "sunday"
                ? 320
                : 480
        }
      />
      <figcaption>
        <span>{label}</span>
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
export function Message({ message }) {
  return message.type === "narration" ? (
    <p className="narration">{message.text}</p>
  ) : (
    <div className={`message-row ${message.sender === "Никита" ? "mine" : ""}`}>
      <div className="bubble">
        <span className="sender">{message.sender}</span>
        <p>{message.text}</p>
        {message.time && <time>{message.time}</time>}
      </div>
    </div>
  );
}
export function Chat({ messages, title }) {
  return (
    <div className="chat">
      {title && (
        <>
          <div className="eyebrow">СООБЩЕНИЯ</div>
          <p className="chat-title">{title}</p>
        </>
      )}
      {messages.map((m, i) => (
        <Message key={i} message={m} />
      ))}
    </div>
  );
}
export function Scene({ scene }) {
  return (
    <>
      <h1>{scene.title}</h1>
      {scene.time && <p className="caption">{scene.time}</p>}
      {scene.type === "messages" ? (
        <>
          <div className="messages-layout">
            <Photo id={scene.id} compact />
            <div className="chat-panel">
              <Chat title="Диалог с Димой" messages={scene.messages} />
            </div>
          </div>
          <div className="reading">
            <p className="narration">{scene.narration}</p>
            <Monologue text={scene.monologue} />
          </div>
        </>
      ) : (
        <>
          <Photo id={scene.id} />
          <div className="reading">
            {scene.type === "monologue" ? (
              <Monologue text={scene.text} />
            ) : (
              <>
                {scene.messages && (
                  <Chat title="Уведомление" messages={scene.messages} />
                )}
                {scene.monologue_before && (
                  <Monologue text={scene.monologue_before} />
                )}
                {scene.narration && (
                  <p className="narration">{scene.narration}</p>
                )}
                {scene.monologue_middle && (
                  <Monologue text={scene.monologue_middle} />
                )}
                {scene.dialogue?.map((m, i) => (
                  <Message key={i} message={m} />
                ))}
                {scene.monologue_after && (
                  <Monologue text={scene.monologue_after} />
                )}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
export function MaterialContent({ material: m }) {
  return (
    <div className="material-content">
      {m.type === "chat" && (
        <Chat messages={m.messages} title="Диалог с Димой" />
      )}
      {m.type === "note" && (
        <div className="phone-note">
          <div className="eyebrow">ЗАМЕТКИ / ТЕЛЕФОН НИКИТЫ</div>
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
          <div className="eyebrow">НЕОТПРАВЛЕННОЕ ГОЛОСОВОЕ / МАМЕ</div>
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
