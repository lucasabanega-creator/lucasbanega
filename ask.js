const https = require("https");

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { term, lang } = JSON.parse(event.body);
    const isEs = lang === "es";
    const pyramidVals = isEs ? '"Salida","Corazón","Fondo"' : '"Top","Heart","Base"';

    const prompt = `You are an expert perfumer. Provide complete technical and sensory information about the perfumery ingredient: "${term}".

Respond ONLY with a valid JSON object. No extra text, no backticks, no markdown. Use exactly this structure:
{"name":"official name","latin_name":"botanical or null","olfactory_family":"main family","cas_number":"CAS or null","odor_description":"poetic sensory description 2-3 sentences","odor_keywords":["w1","w2","w3","w4"],"pyramid_position":["value1"],"density_gcm3":"density or null","usage_min_pct":0.5,"usage_max_pct":5.0,"origin":"geographic origin","extraction_method":"method","perfumery_uses":"uses 2-3 sentences","longevity":"larga","ifra_restricted":false,"notable_examples":["Perfume 1","Perfume 2"],"blends_well_with":["ingredient1","ingredient2","ingredient3"]}

RULES: longevity must be one of "corta","media","larga","muy larga". pyramid_position values from: ${pyramidVals}. usage_min_pct and usage_max_pct must be JSON numbers. ifra_restricted must be boolean. ALL text in ${isEs ? "SPANISH" : "ENGLISH"}.`;

    const payload = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve(data));
      });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: result
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
