import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLazyGetGroupDebtorsQuery } from '../../../../store/services/payment.api';
import { useCreatePaymentMutation } from '../../../../store/services/payment.api';
import { Wallet, TrendingUp, TrendingDown, Users, RefreshCw, Calendar, CreditCard, Plus, DollarSign } from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';
import Modal from '../../../Other/UI/Modal/Modal';
import { Alert } from '../../../Other/UI/Alert/Alert';

const MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const METHODS = [
    { value:"cash",         label:"Naqd"           },
    { value:"card",         label:"Karta"           },
    { value:"transfer",     label:"Pul o'tkazmasi" },
    { value:"bank_account", label:"Bank hisobi"     },
];
const fmt = (v) => (v != null && !isNaN(Number(v)))
    ? Number(v).toLocaleString('ru-RU') + ' so\u2018m' : '—';
const fmtNum  = (v) => v ? Number(String(v).replace(/\s/g, '')).toLocaleString('ru-RU') : '';
const parseNum = (v) => String(v || '').replace(/\s/g, '');

/* ── Payment modal for a student ── */
function PaymentModal({ student, open, onClose, onSuccess }) {
    const now = new Date();
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
    const [form, setForm] = useState({
        year: now.getFullYear(), month: now.getMonth() + 1,
        paid_amount: '', required_amount: '', discount_percent: '',
        method: 'cash', comment: '',
    });
    const [baseRequired, setBaseRequired] = useState(''); // chegirmasiz asl summa
    const [displayPaid, setDisplayPaid] = useState('');
    const [errors, setErrors] = useState({});
    const [createPayment, { isLoading: paying }] = useCreatePaymentMutation();

    useEffect(() => {
        if (open && student) {
            const req = student.required > 0 ? String(student.required) : '';
            setBaseRequired(req);
            setForm({ year: now.getFullYear(), month: now.getMonth() + 1, paid_amount: '', required_amount: req, discount_percent: '', method: 'cash', comment: '' });
            setDisplayPaid(''); setErrors({});
        }
    }, [open, student]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'paid_amount') {
            const c = parseNum(value);
            setForm(p => ({ ...p, paid_amount: c }));
            setDisplayPaid(fmtNum(c));
        } else if (name === 'required_amount') {
            const c = parseNum(value);
            setBaseRequired(c);
            // chegirma bor bo'lsa yangi required ni qayta hisoblash
            setForm(p => {
                const disc = +p.discount_percent || 0;
                const newReq = disc > 0 ? String(Math.round(+c * (1 - disc / 100))) : c;
                return { ...p, required_amount: newReq };
            });
        } else if (name === 'discount_percent') {
            const disc = Math.min(100, Math.max(0, +value || 0));
            const base = +baseRequired || +form.required_amount;
            const newReq = disc > 0 ? String(Math.round(base * (1 - disc / 100))) : String(base);
            setForm(p => ({ ...p, discount_percent: value, required_amount: newReq }));
        } else {
            setForm(p => ({ ...p, [name]: value }));
        }
    };

    const validate = () => {
        const e = {};
        if (!form.paid_amount || +form.paid_amount <= 0) e.paid_amount = 'Musbat summa kiriting';
        if (!form.required_amount || +form.required_amount <= 0) e.required_amount = 'Kerakli summani kiriting';
        setErrors(e); return !Object.keys(e).length;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault(); if (!validate()) return;
        try {
            await createPayment({
                student_id: student.id, year: +form.year, month: +form.month,
                paid_amount: +form.paid_amount, required_amount: +form.required_amount,
                method: form.method,
                ...(form.discount_percent && { discount_percent: +form.discount_percent }),
                ...(form.comment && { comment: form.comment }),
            }).unwrap();
            Alert("To'lov qo'shildi", 'success');
            onSuccess?.(); onClose();
        } catch (err) { Alert(err?.data?.message || 'Xatolik', 'error'); }
    };

    const sel = { width: '100%', padding: '9px 12px', background: 'var(--input-bg)', border: '1.5px solid var(--input-border)', borderRadius: 9, color: 'var(--input-text)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' };

    return (
        <Modal open={open} onClose={onClose} title={`To'lov — ${student?.name || ''}`} size="sm">
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {/* Student strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid var(--card-border)' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{(student?.name || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{student?.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{student?.phone || '—'}</div>
                        </div>
                        {student?.required > 0 && (
                            <div style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>
                                {Number(student.required).toLocaleString('ru-RU')} so'm
                            </div>
                        )}
                    </div>
                    {/* Year / Month */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Yil</label>
                            <select name="year" value={form.year} onChange={handleChange} style={sel}>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Oy</label>
                            <select name="month" value={form.month} onChange={handleChange} style={sel}>
                                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Amounts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>To'langan summa</label>
                            <input name="paid_amount" value={displayPaid} onChange={handleChange} placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                            {errors.paid_amount && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{errors.paid_amount}</span>}
                        </div>
                        <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Kerakli summa</label>
                            <input name="required_amount" value={fmtNum(form.required_amount)}
                                onChange={handleChange}
                                placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                            {errors.required_amount && <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>{errors.required_amount}</span>}
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>To'lov usuli</label>
                        <select name="method" value={form.method} onChange={handleChange} style={sel}>
                            {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
                            Chegirma (%)
                        </label>
                        <input name="discount_percent" value={form.discount_percent} onChange={handleChange} type="number" min="0" max="100" placeholder="0" className="search-input" style={{ paddingLeft: 14 }} />
                        {/* Chegirma preview */}
                        {+form.discount_percent > 0 && +baseRequired > 0 && (
                            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}>
                                <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                    {Number(baseRequired).toLocaleString('ru-RU')} so'm
                                </span>
                                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>−{form.discount_percent}%</span>
                                <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                                    = {Number(form.required_amount).toLocaleString('ru-RU')} so'm
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Izoh (ixtiyoriy)</label>
                        <textarea name="comment" value={form.comment} onChange={handleChange} rows={2} placeholder="Qo'shimcha..."
                            className="search-input" style={{ paddingLeft: 14, height: 'auto', resize: 'vertical' }} />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                    <button type="submit" className="btn-submit" disabled={paying}>
                        <Plus size={14} />{paying ? 'Saqlanmoqda...' : "To'lov qo'shish"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function StudentsTab({ students = [] }) {
    const { id: groupId } = useParams();
    const role = useSelector(s => s.auth.role);
    const is_payment = useSelector(s => s.auth.is_payment);
    const isTeacher = role === 'teacher';
    // To'lov columnini faqat is_payment=true bo'lsa va teacher bo'lmasa ko'rsat
    const showPayment = !isTeacher && is_payment;
    const now = new Date();
    const [year,  setYear]  = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [payStudent, setPayStudent] = useState(null);

    const [fetchDebtors, { data, isLoading, isFetching, error }] = useLazyGetGroupDebtorsQuery();

    useEffect(() => {
        if (groupId) fetchDebtors({ group_id: groupId, year, month });
    }, [groupId, year, month]);

    const debtorsMap = useMemo(() => {
        const list = data?.data?.students || data?.students || [];
        return list.reduce((acc, item) => { acc[item.student_id] = item; return acc; }, {});
    }, [data]);

    const rows = useMemo(() => students.map(s => {
        const price = Number(s.price) || 0;
        const d = debtorsMap[s.id];
        return d
            ? { id: s.id, name: s.full_name, phone: s.phone || '—', required: Number(d.required_amount) || price, paid: Number(d.paid_amount) || 0, debt: Number(d.debt) || 0 }
            : { id: s.id, name: s.full_name, phone: s.phone || '—', required: price, paid: price, debt: 0 };
    }).sort((a, b) => b.debt - a.debt), [students, debtorsMap]);

    const totals = useMemo(() => rows.reduce(
        (acc, r) => ({ req: acc.req + r.required, paid: acc.paid + r.paid, debt: acc.debt + r.debt }),
        { req: 0, paid: 0, debt: 0 }
    ), [rows]);

    const pct = totals.req > 0 ? Math.min(100, Math.round(totals.paid / totals.req * 100)) : 0;
    const loading = isLoading || isFetching;
    const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

    const reload = () => fetchDebtors({ group_id: groupId, year, month });

    if (error) return (
        <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
            Xatolik: {error?.data?.message}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: '10px 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12 }}>
                <Calendar size={16} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>To'lov holati</span>
                <select className="search-select" value={year} onChange={e => setYear(+e.target.value)}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="search-select" value={month} onChange={e => setMonth(+e.target.value)}>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <button className="btn-refresh" onClick={reload} title="Yangilash">
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                    { icon: Wallet,      label: 'Jami kerak',   val: fmt(totals.req),  color: '#3b82f6' },
                    { icon: TrendingUp,  label: "To'langan",    val: fmt(totals.paid), color: 'var(--success)' },
                    { icon: TrendingDown,label: 'Qarz',          val: fmt(totals.debt), color: 'var(--danger)' },
                ].map((c, i) => (
                    <div key={i} style={{ flex: '1 1 140px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: c.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <c.icon size={18} style={{ color: c.color }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.label}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: i === 2 && totals.debt > 0 ? 'var(--danger)' : i === 1 ? 'var(--success)' : 'var(--text-primary)', wordBreak: 'break-word' }}>{c.val}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Umumiy to'lov foizi</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{pct}%</strong>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: 'var(--input-bg)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)', transition: 'width 0.4s' }} />
                </div>
            </div>

            {/* Table */}
            {loading ? <Loading /> : students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <Users size={40} style={{ opacity: .2, margin: '0 auto 10px' }} />
                    <p>Guruhda o'quvchilar mavjud emas</p>
                </div>
            ) : (
                <div className="data-table-wrap">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>№</th><th>Ism</th><th>Telefon</th>
                                <th>Kerakli</th><th>To'langan</th><th>Qarz</th>
                                <th>Progress</th><th>Holat</th>
                                {showPayment && <th>To'lov</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => {
                                const p = r.required > 0 ? Math.min(100, Math.round(r.paid / r.required * 100)) : 0;
                                return (
                                    <tr key={r.id}>
                                        <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{i + 1}</td>
                                        <td>
                                            {isTeacher ? (
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span>
                                            ) : (
                                                <Link to={`/student/${r.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}
                                                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                                                    onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}>
                                                    {r.name}
                                                </Link>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{r.phone}</td>
                                        <td>{fmt(r.required)}</td>
                                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(r.paid)}</td>
                                        <td style={{ color: r.debt > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: r.debt > 0 ? 700 : 400 }}>
                                            {r.debt > 0 ? fmt(r.debt) : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 80, height: 6, borderRadius: 99, background: 'var(--input-bg)', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${p}%`, borderRadius: 99, background: p >= 100 ? 'var(--success)' : p >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
                                                </div>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 30 }}>{p}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: r.debt <= 0 ? 'var(--success-soft)' : 'var(--danger-soft)', color: r.debt <= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {r.debt <= 0 ? "To'liq" : "Qarzdor"}
                                            </span>
                                        </td>
                                        {showPayment && (
                                            <td>
                                                <button
                                                    className="action-btn action-btn-primary"
                                                    onClick={() => setPayStudent(r)}
                                                    title="To'lov qo'shish"
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <CreditCard size={13} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot></tfoot>
                    </table>
                </div>
            )}

            {/* Payment modal */}
            <PaymentModal
                student={payStudent}
                open={!!payStudent}
                onClose={() => setPayStudent(null)}
                onSuccess={() => { setPayStudent(null); reload(); }}
            />
        </div>
    );
}
