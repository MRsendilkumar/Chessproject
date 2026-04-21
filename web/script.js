async function sendMoveToAI(from, to) {
  const response = await fetch(`${API_BASE}/ai-move`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      from: [from.row, from.col],
      to: [to.row, to.col]
    })
  });
    const API_BASE = "https://humble-guacamole-v6px5wqqgj9jhp6jv-5000.app.github.dev/API";
  const data = await response.json();

  if (data.ai_from) {
    movePiece(data.ai_from, data.ai_to);
    function movePiece(from, to) {
  const fromIndex = from[0] * 8 + from[1];
  const toIndex = to[0] * 8 + to[1];

  const squares = document.querySelectorAll('.square');

  squares[toIndex].textContent = squares[fromIndex].textContent;
  squares[fromIndex].textContent = '';
}
  }
}