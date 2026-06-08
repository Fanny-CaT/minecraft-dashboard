"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { S } from "@/lib/constants";

export interface ContextMenuAction {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  disabled?: boolean;
  onClick: () => void;
  separator?: boolean;
}

interface ContextMenuContextType {
  showMenu: (e: React.MouseEvent, actions: ContextMenuAction[]) => void;
  hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [actions, setActions] = useState<ContextMenuAction[]>([]);

  const showMenu = (e: React.MouseEvent, newActions: ContextMenuAction[]) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(true);
    // Rough estimation to prevent menu from going off-screen
    const menuWidth = 180;
    const menuHeight = newActions.length * 35;
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    setPosition({ x, y });
    setActions(newActions);
  };

  const hideMenu = () => {
    setIsVisible(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => hideMenu();
    if (isVisible) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", hideMenu);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", hideMenu);
    };
  }, [isVisible]);

  return (
    <ContextMenuContext.Provider value={{ showMenu, hideMenu }}>
      {children}
      {isVisible && (
        <div
          style={{
            position: "fixed",
            top: position.y,
            left: position.x,
            zIndex: 9999,
            backgroundColor: "#2a2d2e",
            border: `1px solid ${S.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            borderRadius: "4px",
            padding: "4px",
            minWidth: "160px",
            display: "flex",
            flexDirection: "column",
          }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {actions.map((action, idx) => {
            if (action.separator) {
              return <div key={`sep-${idx}`} style={{ height: "1px", backgroundColor: S.border, margin: "4px 0" }} />;
            }
            return (
              <button
                key={idx}
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  hideMenu();
                }}
                className="button-hover"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  backgroundColor: "transparent",
                  color: action.color || S.white,
                  border: "none",
                  fontSize: "12px",
                  cursor: action.disabled ? "not-allowed" : "pointer",
                  opacity: action.disabled ? 0.5 : 1,
                  textAlign: "left",
                  width: "100%",
                  borderRadius: "2px",
                }}
              >
                {action.icon}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </ContextMenuContext.Provider>
  );
}

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) throw new Error("useContextMenu must be used within ContextMenuProvider");
  return context;
};
