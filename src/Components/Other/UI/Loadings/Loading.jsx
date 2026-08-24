export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative w-12 h-12">
                <div
                    className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                    style={{ borderTopColor: 'var(--accent)', borderRightColor: 'var(--accent-glow)' }}
                />
                <div
                    className="absolute inset-2 rounded-full"
                    style={{ background: 'var(--accent-soft)' }}
                />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                Yuklanmoqda...
            </span>
        </div>
    );
}
