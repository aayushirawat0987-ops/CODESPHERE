/**
 * Surge Simulation CLI Trigger (Node.js)
 * ---------------------------------------
 * Can be run via terminal: `node surgeCli.js` or `npm run surge`
 * Sends HTTP POST request to running Vitalis server to simulate incoming patients.
 */

const http = require("http");

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "localhost";

console.log("⚡ Triggering Vitalis Triage Surge Simulation...");

const req = http.request(
  {
    hostname: HOST,
    port: PORT,
    path: "/api/surge",
    method: "POST",
    headers: { "Content-Type": "application/json" }
  },
  res => {
    let body = "";
    res.on("data", chunk => (body += chunk));
    res.on("end", () => {
      if (res.statusCode === 200) {
        try {
          const data = JSON.parse(body);
          console.log(`✅ Success! ${data.status} (${data.patient_count} patients added).`);
          console.log("Check the Nurse Dashboard to watch queue re-sort in real time!");
        } catch (e) {
          console.log("✅ Surge triggered successfully!");
        }
      } else {
        console.error(`❌ Error from server: ${res.statusCode} - ${body}`);
      }
    });
  }
);

req.on("error", err => {
  console.error(`❌ Could not connect to Vitalis server at http://${HOST}:${PORT}. Is backend server running?`);
  console.error(`Details: ${err.message}`);
  process.exit(1);
});

req.end();
