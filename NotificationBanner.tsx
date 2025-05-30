import { useNotification } from "./src/context/NotificationContext";

export function NotificationBanner() {
  const { message, setMessage } = useNotification();
  if (!message) return null;
  return (
    <div style={{ background: "#ffe066", padding: "1em", textAlign: "center" }}>
      {message}
      <button onClick={() => setMessage(null)} style={{ marginLeft: 10 }}>Dismiss</button>
    </div>
  );
}