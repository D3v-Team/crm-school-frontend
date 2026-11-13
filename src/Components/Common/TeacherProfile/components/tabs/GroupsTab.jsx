import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layers, Users } from "lucide-react";
import Loading from "../../../../Other/UI/Loadings/Loading";
import { useLazyGetGroupsQuery } from "../../../../../store/services/group.api";

export default function GroupsTab() {
    const { id } = useParams();
    const [fetchGroups, { data, isLoading, error }] = useLazyGetGroupsQuery();

    useEffect(() => {
        if (id) fetchGroups({ teacher_id: id, page: 1, limit: 200 });
    }, [id, fetchGroups]);

    if (isLoading) return <Loading />;
    if (error) return <div role="alert" style={{ color: "var(--danger)", padding: 12, background: "var(--danger-soft)", borderRadius: 10 }}>Xatolik: {error?.data?.message || "Guruhlarni yuklab bo'lmadi"}</div>;

    const groups = data?.data?.records || [];
    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Layers size={16} style={{ color: "var(--accent)" }} />
                <strong style={{ color: "var(--text-primary)" }}>O&apos;qituvchi guruhlari</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{groups.length} ta</span>
            </div>
            {groups.length === 0 ? (
                <div style={{ textAlign: "center", padding: 36, color: "var(--text-muted)" }}>O&apos;qituvchiga guruh biriktirilmagan</div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                    {groups.map((group) => (
                        <Link key={group.id} to={`/group/${group.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "1px solid var(--card-border)", borderRadius: 10, background: "var(--card-bg)", color: "var(--text-primary)", textDecoration: "none" }}>
                            <Layers size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
                            <span style={{ minWidth: 0, flex: 1 }}>
                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.82rem", fontWeight: 600 }}>{group.name}</span>
                                <span style={{ display: "flex", gap: 8, marginTop: 3, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    <span>{group.subject?.name || "Fan belgilanmagan"}</span>
                                    <span><Users size={10} style={{ verticalAlign: "middle" }} /> {group.students_count ?? 0}</span>
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
