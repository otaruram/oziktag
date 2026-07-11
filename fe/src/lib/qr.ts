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
