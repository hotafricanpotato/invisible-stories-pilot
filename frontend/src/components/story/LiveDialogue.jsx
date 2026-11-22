import { Paragraphs } from "../UI";
export default function LiveDialogue({ message }) {
  return <section className="live-dialogue" aria-label="Текущая реплика">
    <strong className="dialogue-speaker">{message.sender}</strong>
    <Paragraphs text={message.text} />
  </section>;
}
