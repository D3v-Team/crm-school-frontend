/**
 * Reusable form field wrapper with icon, label, error support
 * Props: label, icon, error, valid, children
 */
export default function FormField({ label, icon: Icon, error, valid, children }) {
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div
                        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                        style={{ color: error ? "var(--danger)" : valid ? "var(--success)" : "var(--text-muted)" }}
                    >
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                {children}
            </div>
            {error && (
                <span className="text-xs font-medium" style={{ color: "var(--danger)" }}>
                    {error}
                </span>
            )}
        </div>
    );
}

/**
 * Styled input
 */
export function Input({ icon, error, valid, className = "", ...props }) {
    const borderColor = error
        ? "var(--danger)"
        : valid
            ? "var(--success)"
            : "var(--input-border)";

    const focusBorderColor = error ? "var(--danger)" : "var(--accent)";

    return (
        <input
            {...props}
            style={{
                background: "var(--input-bg)",
                border: `1.5px solid ${borderColor}`,
                color: "var(--input-text)",
                borderRadius: "10px",
                padding: icon ? "10px 14px 10px 38px" : "10px 14px",
                width: "100%",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            className={`field-input ${className}`}
            onFocus={(e) => {
                e.target.style.borderColor = focusBorderColor;
                e.target.style.boxShadow = `0 0 0 3px var(--accent-glow)`;
                if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
                e.target.style.borderColor = borderColor;
                e.target.style.boxShadow = "none";
                if (props.onBlur) props.onBlur(e);
            }}
        />
    );
}

/**
 * Styled select
 */
export function Select({ icon, error, valid, children, className = "", ...props }) {
    const borderColor = error
        ? "var(--danger)"
        : valid
            ? "var(--success)"
            : "var(--input-border)";

    return (
        <select
            {...props}
            style={{
                background: "var(--input-bg)",
                border: `1.5px solid ${borderColor}`,
                color: "var(--input-text)",
                borderRadius: "10px",
                padding: icon ? "10px 14px 10px 38px" : "10px 14px",
                width: "100%",
                fontSize: "0.875rem",
                outline: "none",
                appearance: "none",
                cursor: "pointer",
                transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            className={className}
            onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-glow)";
            }}
            onBlur={(e) => {
                e.target.style.borderColor = borderColor;
                e.target.style.boxShadow = "none";
            }}
        >
            {children}
        </select>
    );
}
