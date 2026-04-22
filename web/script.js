
<script>
const API_BASE = 'https://chessproject.onrender.com';

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');

let selected = null;
fetch("http://127.0.0.1:5000/board")
  .then(res => res.json())
  .then(data => {
    console.log(data);
    drawBoard(data);
  });

// create board UI
function createBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement('div');
      sq.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
      sq.dataset.row = r;
      sq.dataset.col = c;
      sq.onclick = onClick;
      boardEl.appendChild(sq);
    }
  }
}

async function testBackend() {
  try {
    const res = await fetch(API_BASE + "/");
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

  } catch (err) {
    statusEl.innerText = "❌ Backend error";
  }
}

createBoard();
testBackend();
</script>