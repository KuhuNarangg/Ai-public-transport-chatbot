async function sendMessage() {
    const input = document.getElementById("userInput");
    const message = input.value;
    const responseBox = document.getElementById("response");

    const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    });

    const data = await res.json();
    responseBox.innerText = data.reply;
    input.value = "";
}