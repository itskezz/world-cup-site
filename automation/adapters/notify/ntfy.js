// automation/adapters/notify/ntfy.js
export async function sendNtfy(message, title = "World Cup Site") {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;

  const headers = {
    Title: title,
    Priority: "default"
  };

  if (process.env.NTFY_TOKEN) {
    headers.Authorization = `Bearer ${process.env.NTFY_TOKEN}`;
  }

  await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
    method: "POST",
    headers,
    body: message
  });
}