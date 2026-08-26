import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLazyGetGradesQuery, useCreateGradeMutation, useUpdateGradeMutation } from '../../../../store/services/grades.api';
import { RefreshCw, Check, Clock } from 'lucide-react';
import { Alert } from '../../../Other/UI/Alert/Alert';
import Modal from '../../../Other/UI/Modal/Modal';
import Loading from '../../../Other/UI/Loadings/Loading';

const DAY_LABELS = { monday:'Dushanba', tuesday:'Seshanba', wednesday:'Chorshanba', thursday:'Payshanba', friday:'Juma', saturday:'Shanba', sunday:'Yakshanba' };
const fmtLocal = (d) => { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; };
const parseLocal = (s) => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const scoreColor = (s) => s == null ? 'var(--text-muted)' : s>=80 ? 'var(--success)' : s>=60 ? 'var(--warning)' : 'var(--danger)';
const scoreBg = (s) => s == null ? 'var(--input-bg)' : s>=80 ? 'var(--success-soft)' : s>=60 ? 'var(--warning-soft)' : 'var(--danger-soft)';

export default function GradesTab() {
    const { id: groupId } = useParams();
    const role = useSelector(s => s.auth?.role);
    const isTeacher = role === 'teacher';
    const [fetchGrades, { data, isLoading, error }] = useLazyGetGradesQuery();
    const [createGrade] = useCreateGradeMutation();
    const [updateGrade] = useUpdateGradeMutation();

    const now = new Date();
    const [dateFrom, setDateFrom] = useState(fmtLocal(new Date(now.getFullYear(), now.getMonth(), 1)));
    const [dateTo,   setDateTo]   = useState(fmtLocal(new Date(now.getFullYear(), now.getMonth()+1, 0)));
    const [localData, setLocalData] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected]   = useState(null);
    const [modalScore, setModalScore] = useState('');
    const [modalComment, setModalComment] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (groupId) fetchGrades({ group_id:groupId, date_from:dateFrom, date_to:dateTo, page:1, limit:100 }); }, [groupId, dateFrom, dateTo]);
    useEffect(() => { if (data) setLocalData(data); }, [data]);

    const records = localData?.data?.records || [];
    const allDates = useMemo(() => {
        const dates=[]; let cur=parseLocal(dateFrom); const end=parseLocal(dateTo);
        while(cur<=end){dates.push(fmtLocal(cur));cur.setDate(cur.getDate()+1);}
        return dates;
    }, [dateFrom, dateTo]);

    const studentMap = useMemo(() => {
        const map = {};
        records.forEach(s => {
            if (!s.student_id) return;
            map[s.student_id] = { full_name: s.full_name||'Noma\'lum', dates:{} };
            s.dates?.forEach(de => {
                map[s.student_id].dates[de.date] = (de.subjects||[]).map(sb=>({ subject_name:sb.subject_name||'Noma\'lum', score:sb.score, grade_id:sb.grade_id, comment:sb.comment||'', group_schedule_id:sb.group_schedule_id }));
            });
            allDates.forEach(d => { if(!map[s.student_id].dates[d]) map[s.student_id].dates[d]=[]; });
        });
        return map;
    }, [records, allDates]);

    const students = useMemo(() => Object.entries(studentMap).map(([id,d])=>({ id, full_name:d.full_name })), [studentMap]);

    const openModal = (studentId, date, idx) => {
        const sd = studentMap[studentId]; if (!sd) return;
        const subjects = sd.dates[date]||[]; if (idx >= subjects.length) return;
        const s = subjects[idx];
        setSelected({ studentId, studentName:sd.full_name, date, idx, subjectName:s.subject_name, score:s.score, gradeId:s.grade_id, groupScheduleId:s.group_schedule_id, comment:s.comment||'' });
        setModalScore(s.score!=null ? String(s.score) : '');
        setModalComment(s.comment||'');
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!selected) return;
        const score = Number(modalScore);
        if (isNaN(score)||score<0||score>100) { Alert('Baho 0-100 orasida bo\'lishi kerak','warning'); return; }
        setSaving(true);
        try {
            const { studentId, date, idx, gradeId, groupScheduleId } = selected;
            let res;
            if (gradeId) res = await updateGrade({ id:gradeId, data:{ score, comment:modalComment } }).unwrap();
            else res = await createGrade({ student_id:studentId, group_schedule_id:groupScheduleId, date, score, comment:modalComment }).unwrap();
            setLocalData(prev => {
                if (!prev) return prev;
                const nd = JSON.parse(JSON.stringify(prev));
                for (const rec of nd.data.records) {
                    if (rec.student_id===studentId) {
                        for (const de of rec.dates) {
                            if (de.date===date) { const sb=de.subjects[idx]; if(sb&&sb.group_schedule_id===groupScheduleId){sb.score=score;sb.comment=modalComment;if(!gradeId&&res?.id)sb.grade_id=res.id;} }
                        }
                    }
                }
                return nd;
            });
            Alert('Baho saqlandi','success');
            setModalOpen(false);
        } catch(err){ Alert(err?.data?.message||'Xatolik','error'); }
        finally { setSaving(false); }
    };

    if (isLoading) return <Loading/>;
    if (error) return <div style={{ color:'var(--danger)', padding:12, background:'var(--danger-soft)', borderRadius:10 }}>Xatolik</div>;

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'flex-end' }}>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Dan</label>
                    <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="search-input" style={{ paddingLeft:14, width:150 }}/>
                </div>
                <div>
                    <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Gacha</label>
                    <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="search-input" style={{ paddingLeft:14, width:150 }}/>
                </div>
              
            </div>

            {students.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)' }}><Clock size={40} style={{ opacity:.2, margin:'0 auto 10px' }}/><p>O'quvchilar topilmadi</p></div>
            ) : (
                <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid var(--card-border)', background:'var(--card-bg)' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
                        <thead>
                            <tr style={{ background:'var(--accent-soft)' }}>
                                <th style={{ padding:'11px 16px', textAlign:'left', fontWeight:700, color:'var(--accent)', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', position:'sticky', left:0, background:'var(--accent-soft)', zIndex:2 }}>O'quvchi</th>
                                {allDates.map(d => {
                                    const day = parseLocal(d).toLocaleDateString('en-US',{weekday:'long'}).toLowerCase();
                                    return (
                                        <th key={d} style={{ padding:'11px 10px', textAlign:'center', fontWeight:700, color:day==='sunday'?'var(--danger)':'var(--accent)', fontSize:'0.72rem', minWidth:110 }}>
                                            {parseLocal(d).toLocaleDateString('uz-UZ',{day:'2-digit',month:'2-digit'})}
                                            <div style={{ fontSize:'0.65rem', fontWeight:400, color:'var(--text-muted)' }}>{DAY_LABELS[day]?.slice(0,3)}</div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(s => {
                                const sd = studentMap[s.id];
                                return (
                                    <tr key={s.id} style={{ borderTop:'1px solid var(--card-border)' }}
                                        onMouseEnter={e=>e.currentTarget.style.background='var(--accent-soft)'}
                                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                        <td style={{ padding:'10px 16px', fontWeight:600, color:'var(--text-primary)', position:'sticky', left:0, background:'var(--card-bg)', zIndex:1 }}>
                                            {isTeacher ? (
                                                <span>{s.full_name}</span>
                                            ) : (
                                                <Link to={`/student/${s.id}`} style={{ color:'inherit', textDecoration:'none' }}
                                                    onMouseEnter={e=>e.target.style.color='var(--accent)'}
                                                    onMouseLeave={e=>e.target.style.color='inherit'}>{s.full_name}</Link>
                                            )}
                                        </td>
                                        {allDates.map(d => {
                                            const subjects = sd?.dates?.[d]||[];
                                            if (!subjects.length) return <td key={d} style={{ padding:'10px', textAlign:'center', color:'var(--text-muted)', fontSize:'0.72rem' }}>—</td>;
                                            return (
                                                <td key={d} style={{ padding:'6px 10px' }}>
                                                    <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'center' }}>
                                                        {subjects.map((sb, idx) => {
                                                            const sc = sb.score;
                                                            return (
                                                                <button key={idx} onClick={()=>openModal(s.id,d,idx)}
                                                                    style={{ fontSize:'0.68rem', fontWeight:600, padding:'2px 8px', borderRadius:6, border:`1px solid ${scoreColor(sc)}`, background:scoreBg(sc), color:scoreColor(sc), cursor:'pointer', whiteSpace:'nowrap', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis' }}
                                                                    title={`${sb.subject_name}: ${sc!=null?sc+'%':'baholanmagan'}`}>
                                                                    {idx+1}. {sb.subject_name} {sc!=null?`(${sc}%)`:' '}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={modalOpen} onClose={()=>setModalOpen(false)} title={selected?.subjectName||'Baho'} size="sm">
                <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                        O'quvchi: <strong style={{ color:'var(--text-primary)' }}>{selected?.studentName}</strong> · {selected?.date && parseLocal(selected.date).toLocaleDateString('uz-UZ')}
                    </div>
                    <div>
                        <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Baho (0-100%)</label>
                        <input type="number" value={modalScore} onChange={e=>setModalScore(e.target.value)} min={0} max={100} placeholder="0-100" className="search-input" style={{ paddingLeft:14 }}/>
                    </div>
                    <div>
                        <label style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'block', marginBottom:4 }}>Izoh</label>
                        <textarea value={modalComment} onChange={e=>setModalComment(e.target.value)} rows={2} placeholder="Qo'shimcha..." className="search-input" style={{ paddingLeft:14, height:'auto', resize:'vertical' }}/>
                    </div>
                    {selected?.score != null && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Joriy baho: <strong>{selected.score}%</strong></div>}
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={()=>setModalOpen(false)}>Bekor qilish</button>
                    <button className="btn-submit" onClick={handleSave} disabled={saving}><Check size={14}/>{saving?'Saqlanmoqda...':'Saqlash'}</button>
                </div>
            </Modal>
        </div>
    );
}
