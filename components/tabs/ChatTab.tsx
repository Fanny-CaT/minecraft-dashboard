import React from "react";
import { Ico } from "@/components/icons";
import { S } from "@/lib/constants";

interface ChatMessage {
  player: string;
  msg: string;
  ts: string;
}

interface ChatTabProps {
  chatMessages: ChatMessage[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  sendChat: (e: React.FormEvent) => void;
  isOnline: boolean;
  chatInput: string;
  setChatInput: (val: string) => void;
  TabHeader: React.FC<{ label: string; icon: React.ReactNode }>;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  chatMessages,
  chatEndRef,
  sendChat,
  isOnline,
  chatInput,
  setChatInput,
  TabHeader,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%" }}>
      <TabHeader label="In-Game Chat Log" icon={<Ico.Chat />} />

      <div
        style={{
          flex: 1,
          backgroundColor: "#141414",
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          minHeight: 0,
        }}
      >
        {chatMessages.length === 0 ? (
          <div style={{ color: "#555", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
            No chat messages caught in console yet.
          </div>
        ) : (
          chatMessages.map((m, i) => {
            const isYou = m.player === "You";
            const isServer = m.player === "Server";
            let senderColor = S.cyan;
            if (isYou) senderColor = S.orange;
            if (isServer) senderColor = S.red;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "8px",
                  fontSize: "12.5px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: S.muted, fontSize: "10px", fontFamily: "monospace", marginTop: "2px" }}>
                  [{m.ts}]
                </span>
                <span style={{ color: senderColor, fontWeight: "bold" }}>
                  {isYou || isServer ? `[${m.player}]` : `<${m.player}>`}:
                </span>
                <span style={{ color: "#ccc", flex: 1, wordBreak: "break-all" }}>{m.msg}</span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={sendChat}
        style={{ display: "flex", borderTop: `1px solid ${S.border}`, flexShrink: 0 }}
      >
        {!isOnline ? (
          <div
            style={{
              flex: 1,
              backgroundColor: "#161616",
              color: S.muted,
              padding: "10px 14px",
              fontSize: "12px",
              fontStyle: "italic",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            In-game chat broadcast is disabled while the server is offline.
          </div>
        ) : (
          <>
            <input
              type="text"
              placeholder="Broadcast message to server chat..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: S.input,
                color: S.white,
                border: "none",
                padding: "10px 14px",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="button-hover"
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: S.orange,
                border: "none",
                borderLeft: `1px solid ${S.border}`,
                cursor: "pointer",
                fontSize: "12px",
                opacity: !chatInput.trim() ? 0.4 : 1,
                outline: "none",
              }}
            >
              Broadcast
            </button>
          </>
        )}
      </form>
    </div>
  );
};
