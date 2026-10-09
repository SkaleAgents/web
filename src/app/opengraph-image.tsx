import { ImageResponse } from "next/og";

export const alt = "SkaleAgents, the control plane for AI DevOps agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0b0d10", color: "#f4f5f7", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 4, color: "#8b95a5" }}>BUILT FOR THE WORK BEHIND THE DEPLOY</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 128, fontWeight: 700, lineHeight: 1 }}>SkaleAgents</div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 28, color: "#c4cad4" }}>Connect the AI you already use to review your infrastructure.</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#8b95a5" }}>skaleagents.com</div>
      </div>
    ),
    size,
  );
}
