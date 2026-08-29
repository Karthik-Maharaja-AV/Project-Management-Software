"use client";

const styles = {
  body: {
    margin: 0,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    background: "#0c0d10",
    color: "#f2f1ee",
  },
  card: {
    maxWidth: 420,
    padding: "32px",
    textAlign: "center" as const,
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "8px",
  },
  message: {
    fontSize: "14px",
    color: "#a7a49d",
    marginBottom: "20px",
  },
  button: {
    background: "#f0812f",
    color: "#1c0f04",
    border: "none",
    borderRadius: "6px",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
};

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html>
      <body style={styles.body}>
        <div style={styles.card}>
          <p style={styles.title}>Something went wrong</p>
          <p style={styles.message}>
            {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred."}
          </p>
          <button style={styles.button} onClick={() => retry()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
