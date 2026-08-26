import { useParams, useNavigate } from "react-router-dom";
import { useGetUserByIdQuery } from "../../../store/services/user.api";
import { User, Shield, Phone, AtSign, Calendar, ArrowLeft } from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import ProfileTabs from "./components/ProfileTabs";
import UserFaceActions from "./UserFaceActions";

const ROLE_MAP = {
    teacher:'O\'qituvchi', admin:'Administrator',
    super_admin:'Super Admin', hr:'HR', cashier:'Kassir',
};

export default function TeacherProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: userData, isLoading, error } = useGetUserByIdQuery(id, { skip: !id });
    const user = userData?.data || userData;

    if (isLoading) return <Loading/>;
    if (error) return (
        <div style={{ background:'var(--danger-soft)', border:'1px solid var(--danger)', color:'var(--danger)', padding:16, borderRadius:12 }}>
            Xatolik: {error?.data?.message || "Noma'lum xatolik"}
        </div>
    );

    const initials = (user?.full_name||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
    const role = ROLE_MAP[user?.role] || user?.role || 'Foydalanuvchi';

    const meta = [
        { icon:Phone,    label:'Telefon',    value:user?.phone },
        { icon:AtSign,   label:'Username',   value:user?.username },
        { icon:Calendar, label:'Qo\'shilgan', value:user?.createdAt ? new Date(user.createdAt).toLocaleDateString('uz-UZ') : null },
    ].filter(m=>m.value);

    return (
        <div>
            {/* Page title */}
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><User size={18}/></span>
                    O'qituvchi profili
                </div>
                <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--input-bg)', border:'1.5px solid var(--card-border)', borderRadius:9, padding:'7px 14px', cursor:'pointer', fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:600 }}>
                    <ArrowLeft size={14}/> Orqaga
                </button>
            </div>

            {/* Header card */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px', marginBottom:16, boxShadow:'var(--shadow-sm)' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap', flex:1 }}>
                        {/* Avatar */}
                        <div style={{ width:68,height:68,borderRadius:18,background:'var(--accent-soft)',color:'var(--accent)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',fontWeight:700,border:'2px solid var(--card-border)',flexShrink:0 }}>
                            {initials}
                        </div>
                        <div style={{ flex:1, minWidth:200 }}>
                            <h2 style={{ fontSize:'1.1rem',fontWeight:700,color:'var(--text-primary)',margin:'0 0 4px' }}>
                                {user?.full_name || "—"}
                            </h2>
                            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:12 }}>
                                <Shield size={13} style={{ color:'var(--accent)' }}/>
                                <span style={{ fontSize:'0.8rem',color:'var(--accent)',fontWeight:600 }}>{role}</span>
                            </div>
                            <div style={{ display:'flex',flexWrap:'wrap',gap:16 }}>
                                {meta.map(({ icon:Icon, label, value }) => (
                                    <div key={label} style={{ display:'flex',alignItems:'center',gap:8 }}>
                                        <div style={{ width:28,height:28,borderRadius:7,background:'var(--accent-soft)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                                            <Icon size={13} style={{ color:'var(--accent)' }}/>
                                        </div>
                                        <div>
                                            <div style={{ fontSize:'0.68rem',color:'var(--text-muted)',lineHeight:1 }}>{label}</div>
                                            <div style={{ fontSize:'0.82rem',fontWeight:500,color:'var(--text-primary)',lineHeight:1.4 }}>{value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Face actions — top right */}
                    <UserFaceActions
                        userId={id}
                        userName={user?.full_name || '—'}
                        hasFace={!!user?.hikvision_code}
                    />
                </div>
            </div>

            {/* Tabs card */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px', boxShadow:'var(--shadow-sm)' }}>
                <ProfileTabs user={user} subjects={user?.teacher_subjects||[]}/>
            </div>
        </div>
    );
}
