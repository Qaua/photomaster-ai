export const maxDuration = 60;

export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_API_KEY    = process.env.CLOUDINARY_API_KEY;
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
  const CLIPDROP_API_KEY      = process.env.CLIPDROP_API_KEY;

  const { imageBase64, tool } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "Сурет жіберілмеді" });

  try {
    if (["enhance", "upscale", "sharpen"].includes(tool)) {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return res.status(500).json({ error: "Cloudinary keys қойылмаған!" });
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await generateSignature({ timestamp }, CLOUDINARY_API_SECRET);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: imageBase64, api_key: CLOUDINARY_API_KEY, timestamp, signature }),
        }
      );

      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error("Cloudinary: " + uploadData.error.message);

      const transforms = {
        enhance: "e_improve:outdoor:40/e_auto_brightness/e_auto_contrast/e_auto_color",
        upscale: "e_upscale/e_sharpen:100",
        sharpen: "e_unsharp_mask:500:1.5:0.05/e_sharpen:200",
      };

      const resultUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms[tool]}/${uploadData.public_id}.png`;
      await fetch(resultUrl);
      return res.status(200).json({ success: true, imageUrl: resultUrl });
    }

    if (["removebg", "relight", "cleanup"].includes(tool)) {
      if (!CLIPDROP_API_KEY) {
        return res.status(500).json({ error: "Clipdrop API key қойылмаған!" });
      }

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const imageBlob = new Blob([imageBuffer], { type: "image/png" });

      const endpoints = {
        removebg: "https://clipdrop-api.co/remove-background/v1",
        relight:  "https://clipdrop-api.co/relight/v1",
        cleanup:  "https://clipdrop-api.co/cleanup/v1",
      };

      const formData = new FormData();
      formData.append("image_file", imageBlob, "image.png");

      const clipRes = await fetch(endpoints[tool], {
        method: "POST",
        headers: { "x-api-key": CLIPDROP_API_KEY },
        body: formData,
      });

      if (!clipRes.ok) throw new Error(`Clipdrop: ${await clipRes.text()}`);

      const resultBuffer = await clipRes.arrayBuffer();
      const resultBase64 = Buffer.from(resultBuffer).toString("base64");
      return res.status(200).json({ success: true, imageBase64: `data:image/png;base64,${resultBase64}` });
    }

    return res.status(400).json({ error: "Белгісіз tool: " + tool });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function generateSignature(params, apiSecret) {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&") + apiSecret;
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
