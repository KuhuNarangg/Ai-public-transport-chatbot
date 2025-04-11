from flask import Flask, request, jsonify, render_template
import requests

app = Flask(__name__)

GOOGLE_API_KEY = "AIzaSyDdlEY52rDfh8fOyN5sqkJCTEYtTvp0VyA"  # 🔑 Replace with your actual key

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "").lower()

    # Simple parsing logic
    if "from" in user_input and "to" in user_input:
        try:
            origin = user_input.split("from")[1].split("to")[0].strip()
            destination = user_input.split("to")[1].strip()
        except:
            return jsonify({"reply": "⚠️ Please ask like: 'From Delhi to Mumbai'"})
    else:
        return jsonify({"reply": "⚠️ Please use the format: 'From Delhi to Mumbai'"})

    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&mode=transit&transit_mode=train|subway|bus&key={GOOGLE_API_KEY}"

    response = requests.get(url).json()

    if response.get("status") == "OK":
        leg = response["routes"][0]["legs"][0]
        steps = leg["steps"]
        reply_parts = [f"🧭 Best route from {leg['start_address']} to {leg['end_address']}:\n"]

        reply_parts.append(f"⏱ Duration: {leg['duration']['text']}\n📍 Distance: {leg['distance']['text']}\n")

        for step in steps:
            if "transit_details" in step:
                td = step["transit_details"]
                line = td["line"]
                vehicle_type = line["vehicle"]["type"]
                name = line.get("name", "")
                short_name = line.get("short_name", "")
                agency = line.get("agencies", [{}])[0].get("name", "")

                route_info = f"🚉 {vehicle_type}: {name or short_name} by {agency}"
                reply_parts.append(route_info)

        return jsonify({"reply": "\n".join(reply_parts)})
    
    return jsonify({"reply": "❌ Sorry, I couldn't retrieve the route at the moment. Try a different query."})

if __name__ == "__main__":
    app.run(debug=True)
