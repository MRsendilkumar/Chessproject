const API_BASE = 'https://chessproject.onrender.com/API';

async function loadBoard() {
  const res = await fetch(API_BASE + "/board");
  const data = await res.json();
  drawBoard(data);
}

async function testBackend() {
  try {
    const res = await fetch(API_BASE + "/board");
    if (!res.ok) throw "bad";
    statusEl.innerText = "✅ Connected";
  } catch {
    statusEl.innerText = "❌ Cannot reach backend";
  }
}

async function onClick(e) {
  const row = parseInt(e.target.dataset.row);
  const col = parseInt(e.target.dataset.col);

  if (!selected) {
    selected = {row, col};
    e.target.style.outline = '3px solid red';
    return;
  }

  if (selected.row === row && selected.col === col) {
    selected = null;
    e.target.style.outline = '';
    return;
  }

  const from = selected;
  const to = {row, col};
  selected = null;

  document.querySelectorAll('.square').forEach(sq => sq.style.outline = '');

  try {
    const res = await fetch(API_BASE + "/ai-move", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        from: [from.row, from.col],
        to: [to.row, to.col]
      })
    });

    const data = await res.json();

    if (data.status !== "ok") {
      statusEl.innerText = "Invalid move";
      return;
    }

    statusEl.innerText = "Move successful";
    await loadBoard();

  } catch (err) {
    statusEl.innerText = "❌ Backend error";
  }
}

createBoard();
testBackend();
loadBoard();