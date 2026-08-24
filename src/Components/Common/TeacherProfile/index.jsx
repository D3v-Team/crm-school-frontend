import { useParams } from "react-router-dom";
import { useGetUserByIdQuery } from "../../../store/services/user.api";
import { User } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import ProfileHeader from "./components/ProfileHeader";
import ProfileTabs from "./components/ProfileTabs";

export default function TeacherProfile() {
    const { id } = useParams();
    const { data: userData, isLoading, error } = useGetUserByIdQuery(id, { skip: !id });

    const user = userData?.data || userData;

    if (isLoading) return <Loading />;

    if (error) return (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '16px', borderRadius: 12, marginTop: 16 }}>
            Xatolik: {error?.data?.message || "Noma'lum xatolik"}
        </div>
    );

    return (
        <div>
            {/* Page title */}
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><User size={18} /></span>
                    O'qituvchi profili
                </div>
            </div>

            {/* Header card */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 16,
                padding: '20px 24px',
                boxShadow: 'var(--shadow-md)',
                marginBottom: 16,
            }}>
                <ProfileHeader user={user} />
            </div>

            {/* Tabs card */}
            <div style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 16,
                padding: '20px 24px',
                boxShadow: 'var(--shadow-md)',
            }}>
                <ProfileTabs user={user} subjects={user?.teacher_subjects || []} />
            </div>
        </div>
    );
}
