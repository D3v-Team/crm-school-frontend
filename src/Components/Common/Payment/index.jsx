import { useState, useEffect, useCallback } from "react";
import { useLazyGetPaymentsQuery, useDeletePaymentMutation } from "../../../store/services/payment.api";
import { useLazyGetStudentsQuery } from "../../../store/services/student.api";
import { useLazyGetGroupsQuery } from "../../../store/services/group.api";
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, RefreshCw, CreditCard, X, Trash, AlertTriangle,
} from "lucide-react";
import Loading from "../../Other/UI/Loadings/Loading";
import EditPayment from "./__components/EditPayment";
import { Alert } from "../../Other/UI/Alert/Alert";
import Modal from "../../Other/UI/Modal/Modal";

const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const METHOD_LABELS = { cash:"Naqd", card:"Karta", transfer:"Pul o'tkazmasi", bank_account:"Bank hisobi" };
const fmt     = (v) => v != null ? Number(v).toLocaleString("ru-RU") + " so'm" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";

function DeletePaymentInline({ paymentId, onDelete }) {
    const [open, setOpen] = useState(false);
    const [del, { isLoading }] = useDeletePaymentMutation();
    const handle = async () => {
        try { await del(paymentId).unwrap(); Alert("To'lov o'chirildi","success"); onDelete?.(); setOpen(false); }
        catch(err) { Alert(err?.data?.message||"Xatolik","error"); }
    };
    return (
        <>
            <button className="action-btn action-btn-danger" onClick={()=>setOpen(true)} title="O'chirish"><Trash size={13}/></button>
            <Modal open={open} onClose={()=>setOpen(false)} title="To'lovni o'chirish" size="sm">
                <div style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"4px 0 8px" }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:"var(--danger-soft)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <AlertTriangle size={18} style={{ color:"var(--danger)" }}/>
                    </div>
                    <div>
                        <p style={{ fontSize:"0.875rem", color:"var(--text-primary)", marginBottom:4 }}>Ushbu to'lov yozuvini o'chirmoqchimisiz?</p>
                        <p style={{ fontSize:"0.78rem", color:"var(--text-muted)" }}>Bu amalni qaytarib bo'lmaydi.</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={()=>setOpen(false)}>Bekor qilish</button>
                    <button className="btn-delete" onClick={handle} disabled={isLoading}><Trash size={13}/>{isLoading?"O'chirilmoqda...":"O'chirish"}</button>
                </div>
            </Modal>
        </>
    );
}

export default function Payment() {
    const now = new Date();
    const [page, setPage]   = useState(1);
    const [year, setYear]   = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth()+1);
    const [searchStudent, setSearchStudent]         = useState("");
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedGroupId, setSelectedGroupId]     = useState("");
    const [students, setStudents]     = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [trigger, { data, isLoading, error }] = useLazyGetPaymentsQuery();
    const [fetchStudents, { data:studentsData, isLoading:studentsLoading }] = useLazyGetStudentsQuery();
    const [fetchGroups, { data:groupsData }] = useLazyGetGroupsQuery();

    useEffect(() => {
        if (searchStudent.trim().length <= 1) return;
        const timer = setTimeout(() => fetchStudents({ search:searchStudent, limit:10 }), 3000);
        return () => clearTimeout(timer);
    }, [searchStudent]);
    useEffect(() => { if (studentsData) setStudents(studentsData?.data?.records||[]); }, [studentsData]);
    useEffect(() => { fetchGroups({ limit:100 }); }, []);

    const groups = groupsData?.data?.records || [];

    const fetchPayments = useCallback(() => {
        trigger({ page, limit:10, year, month,
            ...(selectedStudentId && { student_id: selectedStudentId }),
            ...(selectedGroupId   && { group_id:   selectedGroupId   }),
        });
    }, [page, year, month, selectedStudentId, selectedGroupId]);

    useEffect(() => { fetchPayments(); }, [fetchPayments]);

    const payments    = data?.data?.records || [];
    const pg          = data?.data?.pagination || {};
    const totalPages  = pg.total_pages || 1;
    const currentPage = pg.currentPage || 1;
    const totalCount  = pg.total_count || 0;
    const years = Array.from({length:7}, (_,i) => now.getFullYear()-3+i);
    const ss = { padding:"9px 12px", background:"var(--input-bg)", border:"1.5px solid var(--input-border)", borderRadius:9, color:"var(--input-text)", fontSize:"0.82rem", outline:"none", cursor:"pointer" };

    return (
        <div>
            <div className="page-toolbar">
                <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:'auto' }}>
                    <span className="page-title-icon"><CreditCard size={18}/></span>
                    <span style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)' }}>To'lovlar tarixi</span>
                </div>
                <select style={ss} value={year} onChange={e=>{setYear(+e.target.value);setPage(1);}}>
                    {years.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
                <select style={ss} value={month} onChange={e=>{setMonth(+e.target.value);setPage(1);}}>
                    {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select style={{...ss, minWidth:120}} value={selectedGroupId} onChange={e=>{setSelectedGroupId(e.target.value);setPage(1);}}>
                    <option value="">Barcha guruhlar</option>
                    {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <div className="search-input-wrap" style={{ position:'relative' }}>
                    <Search className="search-icon" size={16}/>
                    <input className="search-input" type="text" placeholder="O'quvchi qidirish..."
                        value={searchStudent}
                        onChange={e=>{ setSearchStudent(e.target.value); setShowDropdown(true); if(!e.target.value) setSelectedStudentId(""); }}
                        onFocus={()=>setShowDropdown(true)}/>
                    {selectedStudentId && (
                        <button className="toolbar-clear-btn" onClick={()=>{setSelectedStudentId("");setSearchStudent("");setShowDropdown(false);setPage(1);}}>
                            <X size={14}/>
                        </button>
                    )}
                    {showDropdown && searchStudent.length > 1 && (
                        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, width:"100%", background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:10, boxShadow:"var(--shadow-md)", zIndex:50, maxHeight:200, overflowY:"auto" }}>
                            {studentsLoading ? <div style={{ padding:"10px 14px", fontSize:"0.82rem", color:"var(--text-muted)" }}>Yuklanmoqda...</div>
                            : students.length===0 ? <div style={{ padding:"10px 14px", fontSize:"0.82rem", color:"var(--text-muted)" }}>Topilmadi</div>
                            : students.map(s=>(
                                <div key={s.id} onClick={()=>{setSelectedStudentId(s.id);setSearchStudent(s.full_name);setShowDropdown(false);setPage(1);}}
                                    style={{ padding:"10px 14px", cursor:"pointer", borderBottom:"1px solid var(--card-border)" }}
                                    onMouseEnter={e=>e.currentTarget.style.background="var(--accent-soft)"}
                                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                    <div style={{ fontSize:"0.82rem", fontWeight:600, color:"var(--text-primary)" }}>{s.full_name}</div>
                                    <div style={{ fontSize:"0.72rem", color:"var(--text-muted)" }}>{s.phone}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button className="btn-refresh" onClick={fetchPayments} title="Yangilash"><RefreshCw size={15}/></button>
            </div>

            {isLoading && <Loading/>}
            {error && <div style={{ color:"var(--danger)", padding:12, background:"var(--danger-soft)", borderRadius:10 }}>Xatolik: {error?.data?.message}</div>}

            {!isLoading && !error && (
                payments.length===0 ? (
                    <div style={{ textAlign:"center", padding:"60px 0", color:"var(--text-muted)" }}>
                        <CreditCard size={48} style={{ opacity:.2, margin:"0 auto 12px", display:"block" }}/>
                        <p>To'lovlar mavjud emas</p>
                    </div>
                ) : (
                    <>
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>№</th><th>O'quvchi</th><th>Guruh</th><th>Davr</th>
                                        <th>To'langan</th><th>Kerakli</th><th>Chegirma</th>
                                        <th>Usul</th><th>Sana</th><th>Izoh</th><th>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p,i)=>(
                                        <tr key={p.id}>
                                            <td style={{ color:"var(--text-muted)", fontSize:"0.78rem", fontFamily:"monospace" }}>{(currentPage-1)*10+i+1}</td>
                                            <td style={{ fontWeight:600 }}>{p.student?.full_name||"—"}</td>
                                            <td style={{ color:"var(--text-secondary)" }}>{p.student?.group?.name||"—"}</td>
                                            <td style={{ color:"var(--text-secondary)", whiteSpace:"nowrap" }}>{p.year}/{String(p.month).padStart(2,"0")}</td>
                                            <td style={{ color:"var(--success)", fontWeight:600 }}>{fmt(p.paid_amount)}</td>
                                            <td style={{ color:"var(--text-secondary)" }}>{fmt(p.required_amount)}</td>
                                            <td>{p.discount_percent>0?`${p.discount_percent}%`:"—"}</td>
                                            <td>
                                                <span style={{ fontSize:"0.72rem", fontWeight:600, padding:"3px 10px", borderRadius:99, background:"var(--success-soft)", color:"var(--success)" }}>
                                                    {METHOD_LABELS[p.method]||p.method}
                                                </span>
                                            </td>
                                            <td style={{ fontSize:"0.78rem", color:"var(--text-muted)", whiteSpace:"nowrap" }}>{fmtDate(p.createdAt)}</td>
                                            <td style={{ color:"var(--text-muted)", fontSize:"0.78rem", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.comment||"—"}</td>
                                            <td>
                                                <div style={{ display:"flex", gap:6 }}>
                                                    <EditPayment payment={p} onUpdate={fetchPayments}/>
                                                    <DeletePaymentInline paymentId={p.id} onDelete={fetchPayments}/>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="pagination">
                            <span style={{ fontSize:"0.78rem", color:"var(--text-muted)" }}>{totalCount>0&&`Jami ${totalCount} ta to'lov`}</span>
                            <div className="pagination-controls">
                                <button className="page-btn" onClick={()=>setPage(1)} disabled={currentPage<=1}><ChevronsLeft size={15}/></button>
                                <button className="page-btn" onClick={()=>setPage(p=>p-1)} disabled={currentPage<=1}><ChevronLeft size={15}/></button>
                                <span className="page-current">{currentPage}</span>
                                <button className="page-btn" onClick={()=>setPage(p=>p+1)} disabled={currentPage>=totalPages}><ChevronRight size={15}/></button>
                                <button className="page-btn" onClick={()=>setPage(totalPages)} disabled={currentPage>=totalPages}><ChevronsRight size={15}/></button>
                            </div>
                        </div>
                    </>
                )
            )}
        </div>
    );
}
