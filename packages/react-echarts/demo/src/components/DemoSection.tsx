import React from "react";

interface DemoSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function DemoSection({
  title,
  description,
  children,
}: DemoSectionProps): React.ReactElement {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 8,
          color: "#374151",
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 16,
          }}
        >
          {description}
        </p>
      )}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
          background: "#ffffff",
        }}
      >
        {children}
      </div>
    </div>
  );
}
