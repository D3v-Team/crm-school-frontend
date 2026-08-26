import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGetUserByIdQuery } from '../../../store/services/user.api';
import { useLazyGetParentQuery } from '../../../store/services/statistic.api';
import { useLazyGetPaymentsQuery } from '../../../store/services/payment.api';
import { useLazyGetAttendanceQuery } from '../../../store/services/attedance.api';
import Loading from '../../Other/UI/Loadings/Loading';
import {
    User, Phone, AtSign, Calendar, MessageCircle, MessageCircleOff,
    Users, CreditCard, ClipboardList, BarChart2, TrendingUp, TrendingDown,
    Wallet, CheckCircle2, XCircle, Timer, Award, RefreshCw,
    Camera, CameraOff, ArrowLeft,
} from 'lucide-react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';
const fmtLocal = (d) => { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; };
const fmt = (v) => v != null ? Number(v).toLocaleString('ru-RU') + ' so\u2018m' : '—';
const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const ATT = {
    present: { label:'Keldi',    color:'var(--success)', bg:'var(--success-soft)', icon:CheckCircle2 },
    absent:  { label:'Kelmadi',  color:'var(--danger)',  bg:'var(--danger-soft)',  icon:XCircle },
    late:    { label:'Kechikdi', color:'var(--warning)', bg:'var(--warning-soft)', icon:Timer },
};

function Tabs({ tabs, active, onChange }) {
    return (
        <div style={{ display:'flex', gap:4, padding:'4px', background:'var(--input-bg)', borderRadius:12, border:'1px solid var(--card-border)', marginBottom:20, overflowX:'auto' }}>
            {tabs.map(t => (
                <button key={t.key} onClick={() => onChange(t.key)} style={{
                    display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer',
                    fontSize:'0.82rem', fontWeight: active===t.key ? 600 : 500,
                    background: active===t.key ? 'var(--accent)' : 'transparent',
                    color: active===t.key ? '#fff' : 'var(--text-secondary)',
                    transition:'all 0.15s', whiteSpace:'nowrap',
                }}>
                    <t.icon size={14}/>{t.label}
                </button>
            ))}
        </div>
    );
}

/* ── Statistics Tab ── */
function StatsTab({ parentId }) {
    const now = new Date();
    const [year, setYear]   = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [fetchStats, { data, isLoading, error }] = useLazyGetParentQuery();

    const load = () => fetchStats({ year, month });

    const stats = data?.data || data;
    const children = stats?.children || [];
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Filter */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end', padding:'14px 18px', background:'var(--input-bg)', border:'1px solid var(--card-border)', borderRadius:12 }}>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Yil</label>
                    <select className="search-select" value={year} onChange={e => setYear(+e.target.value)}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Oy</label>
                    <select className="search-select" value={month} onChange={e => setMonth(+e.target.value)}>
                        {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                </div>
                <button className="search-btn" onClick={load} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <RefreshCw size={13}/> Ko'rish
                </button>
            </div>

            {isLoading && <Loading/>}
            {error && <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>Xatolik: {error?.data?.message}</div>}

            {!isLoading && !error && !stats && (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
                    <BarChart2 size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
                    <p>Ko'rish tugmasini bosing</p>
                </div>
            )}

            {stats && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {/* Overview cards */}
                    {stats.summary && (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:12 }}>
                            {[
                                { icon:Users,       label:"Farzandlar",        val: stats.summary.total_children ?? '—',   color:'var(--accent)' },
                                { icon:Wallet,      label:"Jami to'lov kerak",  val: fmt(stats.summary.total_required),     color:'#3b82f6' },
                                { icon:TrendingUp,  label:"To'langan",          val: fmt(stats.summary.total_paid),         color:'var(--success)' },
                                { icon:TrendingDown,label:"Qarz",               val: fmt(stats.summary.total_debt),         color:'var(--danger)' },
                            ].map((c, i) => (
                                <div key={i} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                                    <div style={{ width:36, height:36, borderRadius:9, background:c.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                        <c.icon size={16} style={{ color:c.color }}/>
                                    </div>
                                    <div>
                                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{c.label}</div>
                                        <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-primary)' }}>{c.val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Per-child stats */}
                    {children.length > 0 && (
                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                            {children.map((child, ci) => (
                                <div key={child.student_id || ci} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, overflow:'hidden' }}>
                                    <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--card-border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                            <div style={{ width:36, height:36, borderRadius:9, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                                                {(child.full_name||'?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <NavLink to={`/student/${child.student_id}`} style={{ fontWeight:700, color:'var(--text-primary)', textDecoration:'none', fontSize:'0.9rem' }}
                                                    onMouseEnter={e=>e.target.style.color='var(--accent)'}
                                                    onMouseLeave={e=>e.target.style.color='var(--text-primary)'}>
                                                    {child.full_name}
                                                </NavLink>
                                                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:1 }}>{child.group_name || '—'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display:'flex', gap:12 }}>
                                            {child.attendance_percent != null && (
                                                <div style={{ textAlign:'center' }}>
                                                    <div style={{ fontSize:'1rem', fontWeight:700, color:child.attendance_percent>=80?'var(--success)':child.attendance_percent>=50?'var(--warning)':'var(--danger)' }}>{child.attendance_percent}%</div>
                                                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Davomat</div>
                                                </div>
                                            )}
                                            {child.avg_grade != null && (
                                                <div style={{ textAlign:'center' }}>
                                                    <div style={{ fontSize:'1rem', fontWeight:700, color:child.avg_grade>=80?'var(--success)':child.avg_grade>=60?'var(--warning)':'var(--danger)' }}>{Number(child.avg_grade).toFixed(1)}%</div>
                                                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>O'rt. baho</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Payment row */}
                                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:'1px solid var(--card-border)' }}>
                                        {[
                                            { label:"Kerakli",   val:fmt(child.required_amount), color:'var(--text-primary)' },
                                            { label:"To'langan", val:fmt(child.paid_amount),     color:'var(--success)' },
                                            { label:"Qarz",      val:fmt(child.debt),            color: (child.debt||0)>0?'var(--danger)':'var(--text-muted)' },
                                        ].map((c, k) => (
                                            <div key={k} style={{ textAlign:'center', padding:'10px 8px', borderRight: k<2?'1px solid var(--card-border)':'' }}>
                                                <div style={{ fontSize:'0.78rem', fontWeight:700, color:c.color }}>{c.val}</div>
                                                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:1 }}>{c.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Progress bar */}
                                    {(child.required_amount > 0) && (
                                        <div style={{ padding:'10px 18px' }}>
                                            {(() => {
                                                const pct = Math.min(100, Math.round((child.paid_amount||0)/child.required_amount*100));
                                                return (
                                                    <div>
                                                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:4 }}>
                                                            <span>To'lov foizi</span><strong style={{ color:'var(--text-primary)' }}>{pct}%</strong>
                                                        </div>
                                                        <div style={{ height:5, borderRadius:99, background:'var(--input-bg)' }}>
                                                            <div style={{ height:'100%', borderRadius:99, width:`${pct}%`, background:pct>=100?'var(--success)':pct>=50?'var(--warning)':'var(--danger)', transition:'width 0.4s' }}/>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ── Children Tab ── */
function ChildrenTab({ students = [] }) {
    if (students.length === 0) return (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}>
            <Users size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/>
            <p>Farzandlar yo'q</p>
        </div>
    );
    return (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {students.map(s => {
                const cameraLinked = !!s.hikvision_code;
                const initials = (s.full_name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
                return (
                    <NavLink key={s.id} to={`/student/${s.id}`} style={{ textDecoration:'none' }}>
                        <div style={{
                            background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14,
                            padding:'16px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
                            transition:'border-color 0.15s, box-shadow 0.15s', cursor:'pointer',
                        }}
                            onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.boxShadow='0 0 0 3px var(--accent-glow)'; }}
                            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--card-border)'; e.currentTarget.style.boxShadow='none'; }}>

                            {/* Avatar */}
                            <div style={{ width:46, height:46, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1.1rem', flexShrink:0 }}>
                                {initials}
                            </div>

                            {/* Name + status */}
                            <div style={{ flex:1, minWidth:150 }}>
                                <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.95rem', marginBottom:4 }}>{s.full_name}</div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                    <span style={{ fontSize:'0.72rem', fontWeight:600, padding:'2px 8px', borderRadius:99, background: s.is_active?'var(--success-soft)':'var(--danger-soft)', color: s.is_active?'var(--success)':'var(--danger)' }}>
                                        {s.is_active ? 'Faol' : 'Nofaol'}
                                    </span>
                                    {(s.group?.name || s.group_name) && (
                                        <span style={{ fontSize:'0.72rem', fontWeight:600, padding:'2px 8px', borderRadius:99, background:'var(--accent-soft)', color:'var(--accent)' }}>
                                            {s.group?.name || s.group_name}
                                        </span>
                                    )}
                                    <span style={{ fontSize:'0.72rem', fontWeight:600, padding:'2px 8px', borderRadius:99, background: cameraLinked?'var(--success-soft)':'var(--input-bg)', color: cameraLinked?'var(--success)':'var(--text-muted)', display:'inline-flex', alignItems:'center', gap:4 }}>
                                        {cameraLinked
                                            ? <><Camera size={10}/> Kamera ulangan</>
                                            : <><CameraOff size={10}/> Kamera yo'q</>
                                        }
                                    </span>
                                </div>
                            </div>

                            {/* Meta info */}
                            <div style={{ display:'flex', flexWrap:'wrap', gap:14 }}>
                                {s.phone && (
                                    <div>
                                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Telefon</div>
                                        <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)' }}>{s.phone}</div>
                                    </div>
                                )}
                                {s.price && (
                                    <div>
                                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>To'lov narxi</div>
                                        <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)' }}>
                                            {Number(s.price).toLocaleString('ru-RU')} so'm
                                        </div>
                                    </div>
                                )}
                                {s.createdAt && (
                                    <div>
                                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>Qo'shilgan</div>
                                        <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)' }}>
                                            {new Date(s.createdAt).toLocaleDateString('uz-UZ')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </NavLink>
                );
            })}
        </div>
    );
}

/* ── Main ParentProfile ── */
export default function ParentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: userData, isLoading, error } = useGetUserByIdQuery(id, { skip: !id });

    const user     = userData?.data || userData;
    const students = user?.students || [];
    const botConnected = !!user?.chat_id;
    const initials = (user?.full_name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    if (isLoading) return <Loading/>;
    if (error) return (
        <div style={{ background:'var(--danger-soft)', border:'1px solid var(--danger)', color:'var(--danger)', padding:16, borderRadius:12 }}>
            Xatolik: {error?.data?.message}
        </div>
    );
    if (!user) return null;

    return (
        <div>
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><User size={18}/></span>
                    Ota-ona profili
                </div>
                <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--input-bg)', border:'1.5px solid var(--card-border)', borderRadius:9, padding:'7px 14px', cursor:'pointer', fontSize:'0.78rem', color:'var(--text-secondary)', fontWeight:600 }}>
                    <ArrowLeft size={14}/> Orqaga
                </button>
            </div>

            {/* Info card */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px', marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap' }}>
                    {/* Avatar */}
                    <div style={{ width:68, height:68, borderRadius:18, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:700, border:'2px solid var(--card-border)', flexShrink:0 }}>
                        {initials}
                    </div>
                    <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                            <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)', margin:0 }}>{user.full_name}</h2>
                            {botConnected ? (
                                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.72rem', fontWeight:600, padding:'3px 10px', borderRadius:99, background:'var(--success-soft)', color:'var(--success)' }}>
                                    <MessageCircle size={11}/> Bot ulangan
                                </span>
                            ) : (
                                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:'0.72rem', fontWeight:600, padding:'3px 10px', borderRadius:99, background:'var(--danger-soft)', color:'var(--danger)' }}>
                                    <MessageCircleOff size={11}/> Bot ulanmagan
                                </span>
                            )}
                            <span style={{ fontSize:'0.72rem', fontWeight:600, padding:'3px 10px', borderRadius:99, background:'var(--accent-soft)', color:'var(--accent)' }}>
                                {students.length} ta farzand
                            </span>
                        </div>
                     
                        <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
                            {[
                                { icon:Phone,    label:'Telefon',    value:user.phone },
                                { icon:AtSign,   label:'Username',   value:user.username },
                                { icon:Calendar, label:'Qo\'shilgan', value:fmtDate(user.createdAt) },
                                ...(user.chat_id ? [{ icon:MessageCircle, label:'Chat ID', value:user.chat_id }] : []),
                            ].filter(m => m.value).map(({ icon:Icon, label, value }) => (
                                <div key={label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                                    <div style={{ width:28, height:28, borderRadius:7, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                        <Icon size={13} style={{ color:'var(--accent)' }}/>
                                    </div>
                                    <div>
                                        <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{label}</div>
                                        <div style={{ fontSize:'0.82rem', fontWeight:500, color:'var(--text-primary)' }}>{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Farzandlar — to'g'ridan-to'g'ri ko'rsatish, tab yo'q */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px' }}>
                <div style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--text-primary)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                    <Users size={16} style={{ color:'var(--accent)' }}/> Farzandlar
                </div>
                <ChildrenTab students={students}/>
            </div>
        </div>
    );
}
