/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { useGetGroupScheduleByStudentQuery } from "../../../store/services/group-schedule.api";
import Loading from "../../Other/UI/Loadings/Loading";
import { CalendarDays, Clock3, User } from "lucide-react";

const DAY_LABELS = {
    monday: "Dushanba", tuesday: "Seshanba", wednesday: "Chorshanba",
    thursday: "Payshanba", friday: "Juma", saturday: "Shanba", sunday: "Yakshanba",
};
const DAY_ORDER = Object.keys(DAY_LABELS);
const timeText = (time) => time ? time.slice(0, 5) : "—";

export default function StudentScheduleTab({ studentId }) {
    const { data, isLoading, error } = useGetGroupScheduleByStudentQuery(studentId, { skip: !studentId });
    const scheduleData = data?.data || data;
    const schedules = useMemo(() => [...(Array.isArray(scheduleData?.schedules) ? scheduleData.schedules : [])].sort((a, b) => {
        const dayDifference = DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week);
        return dayDifference || String(a.start_time).localeCompare(String(b.start_time));
    }), [scheduleData?.schedules]);

    if (isLoading) return <Loading />;
    if (error) return <div role="alert" style={{ color: "var(--danger)", padding: 12, background: "var(--danger-soft)", borderRadius: 10 }}>Xatolik: {error?.data?.message || "Jadvalni yuklab bo'lmadi"}</div>;
    if (!schedules.length) return <div style={{ textAlign: "center", padding: 28, color: "var(--text-muted)" }}>O&apos;quvchining haftalik dars jadvali topilmadi.</div>;

    return (
        <div style={{ display: "grid", gap: 10 }}>
            {schedules.map((item) => (
                <article key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid var(--card-border)", borderRadius: 11, background: "var(--card-bg)" }}>
                    <div style={{ display: "grid", gap: 4 }}>
                        <strong style={{ color: "var(--text-primary)", fontSize: "0.82rem" }}><CalendarDays size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />{DAY_LABELS[item.day_of_week] || item.day_of_week}</strong>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}><Clock3 size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />{timeText(item.start_time)}–{timeText(item.end_time)}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 650, color: "var(--text-primary)" }}>{item.subject?.name || "Fan belgilanmagan"}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 3, fontSize: "0.73rem", color: "var(--text-muted)" }}>
                            <span>{item.group?.name || "Guruh"}</span>
                            <span><User size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />{item.teacher?.full_name || "O'qituvchi belgilanmagan"}</span>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
