const API_KEY = "YOUR_API_KEY_HERE";

document.getElementById("optimize").onclick = async () => {
  const input = document.getElementById("input").value;
  const resultsDiv = document.getElementById("results");
  const loading = document.getElementById("loading");

  if (!input.trim()) return;

  resultsDiv.innerHTML = "";
  loading.classList.remove("hidden");

  const prompt = `
Rewrite this prompt into 3 versions:

1. Chinese concise
2. English short
3. Mixed Chinese-English (minimize tokens)

Keep meaning the same. Be short.

Return format:

CN:
...

EN:
...

MIX:
...
`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: prompt + "\n\n" + input }
        ]
      })
    });

    const data = await res.json();
    const text = data.choices[0].message.content;

    loading.classList.add("hidden");

    const cn = extract(text, "CN");
    const en = extract(text, "EN");
    const mix = extract(text, "MIX");

    const counts = {
      cn: countTokens(cn),
      en: countTokens(en),
      mix: countTokens(mix),
      original: countTokens(input)
    };

    const best = Object.entries(counts)
      .slice(0, 3)
      .sort((a, b) => a[1] - b[1])[0][0];

    renderCard("CN", cn, counts.cn, best === "cn");
    renderCard("EN", en, counts.en, best === "en");
    renderCard("MIX", mix, counts.mix, best === "mix");

    const bestValue = counts[best];
    const saved = Math.round((1 - bestValue / counts.original) * 100);

    resultsDiv.innerHTML += `
      <p style="font-size:12px;">
        ${counts.original} → ${bestValue} tokens (−${saved}%)
      </p>
    `;
  } catch (err) {
    loading.classList.add("hidden");
    resultsDiv.innerHTML = "<p>Error. Check API key.</p>";
  }
};

function extract(text, label) {
  const regex = new RegExp(label + ":[\\s\\S]*?(?=\\n[A-Z]+:|$)");
  const match = text.match(regex);
  return match ? match[0].replace(label + ":", "").trim() : "";
}

function countTokens(str) {
  return Math.ceil(str.length * 0.6); // demo用
}

function renderCard(title, text, tokens, best) {
  const div = document.getElementById("results");

  div.innerHTML += `
    <div class="card ${best ? "best" : ""}">
      <strong>${title}</strong> ${best ? "⭐" : ""}
      <p>${text}</p>
      <small>${tokens} tokens</small>
    </div>
  `;
}
