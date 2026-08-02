import * as QRCode from "qrcode";

/** Generate QR Code with Oziktag ShieldCheck logo baked into center */
export async function generateQrWithLogo(url: string, size = 512): Promise<string> {
  const qrUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark: "#0b1220", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const logoR = size * 0.11;

      // White ring
      ctx.beginPath();
      ctx.arc(cx, cy, logoR + 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Grey border
      ctx.beginPath();
      ctx.arc(cx, cy, logoR + 4, 0, Math.PI * 2);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Black badge
      ctx.beginPath();
      ctx.arc(cx, cy, logoR, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();

      // ShieldCheck icon (lucide, viewBox 24×24)
      const iconPx = logoR * 1.28;
      const sc = iconPx / 24;
      ctx.save();
      ctx.translate(cx - iconPx / 2, cy - iconPx / 2);
      ctx.scale(sc, sc);

      const shieldPath = new Path2D(
        "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
      );
      ctx.fillStyle = "#ffffff";
      ctx.fill(shieldPath);

      const checkPath = new Path2D("M9 12l2 2 4-4");
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.2 / sc;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(checkPath);

      ctx.restore();
      resolve(canvas.toDataURL("image/png"));
    };
    qrImg.src = qrUrl;
  });
}

/**
 * Generate a high-definition, ready-to-print Tracking Label (PNG Data URL)
 * It contains the QR Code, Product Name, and a SHA256-like identifier.
 */
export async function generateHDTrackingLabel(
  url: string,
  productName: string,
  id: string
): Promise<string> {
  const qrSize = 1024; // High definition QR
  const qrDataUrl = await generateQrWithLogo(url, qrSize);

  // Generate a mock SHA256 hash from the ID to satisfy user requirement for "SHA256" code
  const encoder = new TextEncoder();
  const data = encoder.encode(id);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const sha256Hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  const displayHash = sha256Hex.substring(0, 16).toUpperCase(); // Show first 16 chars

  return new Promise((resolve) => {
    // Label dimensions (Portrait card)
    const canvas = document.createElement("canvas");
    const width = 1200;
    const height = 1500;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Draw QR Code centered at top
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrX = (width - qrSize) / 2;
      const qrY = 100;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Draw Product Name
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 64px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      
      // Basic text wrap for product name
      const words = (productName || "Tracking Product").split(" ");
      let line = "";
      let y = qrY + qrSize + 60;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 200 && n > 0) {
          ctx.fillText(line, width / 2, y);
          line = words[n] + " ";
          y += 80;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, y);

      // Draw "Verified by Oziktag"
      y += 120;
      ctx.fillStyle = "#64748b";
      ctx.font = "500 42px sans-serif";
      ctx.fillText("Verified by Oziktag", width / 2, y);

      // Draw URL
      y += 60;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "400 32px monospace";
      ctx.fillText(url, width / 2, y);

      // Draw SHA256 Hash
      y += 60;
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "400 28px monospace";
      ctx.fillText(`SHA256: ${displayHash}`, width / 2, y);

      resolve(canvas.toDataURL("image/png", 1.0));
    };
    qrImg.src = qrDataUrl;
  });
}
