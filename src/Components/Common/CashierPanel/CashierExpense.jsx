import { useState, useCallback } from 'react';
import {
    useGetExpensesQuery,
    useCreateExpenseMutation,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
    exportExpenseExcel,
} from '../../../store/services/expense.api';
import { Alert } from '../../Other/UI/Alert/Alert';
import Modal from '../../Other/UI/Modal/Modal';
import Loading from '../../Other/UI/Loadings/Loading';
import {
    TrendingDown, Plus, Pencil, Trash2, Download,
    AlertTriangle, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, RefreshCw, Check,
} from 'lucide-react';

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
const fmt     = (v) => v != null ? Number(v).toLocaleString('ru-RU') + " so'm" : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uz-UZ') : '—';

const ss = {
    padding: '9px 12px', background: 'var(--input-bg)',
    border: '1.5px solid var(--input-border)', borderRadius: 9,
    color: 'var(--input-text)', fontSize: '0.82rem', outline: 'none', cursor: 'pointer',
};
const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid var(--input-border)', background: 'var(--input-bg)',
    color: 'var(--input-text)', fontSize: '0.875rem', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
};
const labelStyle = {
    fontSize: '0.78rem', fontWeight: 600,
    color: 'var(--text-secondary)', display: 'block', marginBottom: 6,
};

/* ── Create / Edit Modal ── */
function ExpenseModal({ open, onClose, expense, onSuccess }) {
    const isEdit = !!expense;
    const today  = new Date().toISOString().slice(0, 10);

    const [form, setForm] = useState({
        amount:   expense?.amount   ?? '',
        comment:  expense?.comment  ?? '',
        category: expense?.category ?? '',
        date:     expense?.date     ?? today,
    });

    const [create, { isLoading: creating }] = useCreateExpenseMutation();
    const [update, { isLoading: updating }] = useUpdateExpenseMutation();
    const saving = creating || updating;

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || !form.date) {
            Alert('Summa va sana majburiy', 'error');
            return;
        }
        const payload = {
            amount:   Number(form.amount),
            comment:  form.comment.trim(),
            category: form.category.trim(),
            date:     form.date,
        };
        try {
            if (isEdit) {
                await update({ id: expense.id, data: payload }).unwrap();
                Alert('Xarajat yangilandi', 'success');
            } else {
                await create(payload).unwrap();
                Alert("Xarajat qo'shildi", 'success');
            }
            onSuccess?.();
            onClose();
        } catch (err) {
            Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={isEdit ? 'Xarajatni tahrirlash' : 'Yangi xarajat'} size="sm">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Amount */}
                <div>
                    <label style={labelStyle}>Summa (so'm) *</label>
                    <input type="number" min={0} value={form.amount}
                        onChange={e => set('amount', e.target.value)}
                        placeholder="1 500 000" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e  => e.target.style.borderColor = 'var(--input-border)'}
                    />
                </div>

                {/* Category */}
                <div>
                    <label style={labelStyle}>Kategoriya</label>
                    <input type="text" value={form.category}
                        onChange={e => set('category', e.target.value)}
                        placeholder="Ijara, Maosh, Kommunal..."
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e  => e.target.style.borderColor = 'var(--input-border)'}
                    />
                </div>

                {/* Date */}
                <div>
                    <label style={labelStyle}>Sana *</label>
                    <input type="date" value={form.date}
                        onChange={e => set('date', e.target.value)}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e  => e.target.style.borderColor = 'var(--input-border)'}
                    />
                </div>

                {/* Comment */}
                <div>
                    <label style={labelStyle}>Izoh</label>
                    <textarea value={form.comment}
                        onChange={e => set('comment', e.target.value)}
                        rows={3} placeholder="Xarajat tavsifi..."
                        style={{ ...inputStyle, resize: 'vertical', height: 'auto' }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e  => e.target.style.borderColor = 'var(--input-border)'}
                    />
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                    <button type="submit" className="btn-submit" disabled={saving}>
                        <Check size={14}/>{saving ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

/* ── Delete confirm ── */
function DeleteModal({ open, onClose, expense, onSuccess }) {
    const [del, { isLoading }] = useDeleteExpenseMutation();

    const handle = async () => {
        try {
            await del(expense.id).unwrap();
            Alert("Xarajat o'chirildi", 'success');
            onSuccess?.();
            onClose();
        } catch (err) {
            Alert(err?.data?.message || 'Xatolik', 'error');
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Xarajatni o'chirish" size="sm">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0 8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertTriangle size={18} style={{ color: 'var(--danger)' }}/>
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        Ushbu xarajatni o'chirmoqchimisiz?
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {expense?.category && <strong>{expense.category} · </strong>}
                        {fmt(expense?.amount)} — {fmtDate(expense?.date)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Bu amalni qaytarib bo'lmaydi.
                    </p>
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn-cancel" onClick={onClose}>Bekor qilish</button>
                <button className="btn-delete" onClick={handle} disabled={isLoading}>
                    <Trash2 size={13}/>{isLoading ? "O'chirilmoqda..." : "O'chirish"}
                </button>
            </div>
        </Modal>
    );
}

/* ══════════════════════════════════════════════════════════ */
export default function CashierExpense() {
    const now = new Date();
    const [page,      setPage]      = useState(1);
    const [year,      setYear]      = useState(now.getFullYear());
    const [month,     setMonth]     = useState(now.getMonth() + 1);
    const [category,  setCategory]  = useState('');
    const [exporting, setExporting] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [editItem,   setEditItem]   = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);

    const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

    const { data, isLoading, error, refetch } = useGetExpensesQuery({
        page, limit: 15, year, month,
        ...(category.trim() && { category: category.trim() }),
    });

    const records    = data?.data?.records    || [];
    const pg         = data?.data?.pagination || {};
    const totalPages = pg.total_pages  || 1;
    const currPage   = pg.currentPage  || 1;
    const totalCount = pg.total_count  || 0;
    const totalAmount = records.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const handleExcel = useCallback(async () => {
        setExporting(true);
        try {
            const blob = await exportExpenseExcel({
                year, month,
                ...(category.trim() && { category: category.trim() }),
            });
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.download = `xarajatlar_${year}_${String(month).padStart(2, '0')}.xlsx`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            Alert('Excel yuklab olishda xatolik', 'error');
        } finally {
            setExporting(false);
        }
    }, [year, month, category]);

    return (
        <div>
            {/* Page header */}
            <div className="page-header">
                <div className="page-title">
                    <span className="page-title-icon"><TrendingDown size={18}/></span>
                    Xarajatlar
                </div>
            </div>

            {/* Toolbar */}
            <div className="page-toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
                <select style={ss} value={year} onChange={e => { setYear(+e.target.value); setPage(1); }}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select style={ss} value={month} onChange={e => { setMonth(+e.target.value); setPage(1); }}>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <input
                    type="text" placeholder="Kategoriya..." value={category}
                    onChange={e => { setCategory(e.target.value); setPage(1); }}
                    style={{ ...ss, minWidth: 130, cursor: 'text' }}
                />

                {records.length > 0 && (
                    <div style={{
                        padding: '6px 14px', borderRadius: 9,
                        background: 'var(--danger-soft)', border: '1.5px solid var(--danger)',
                        color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <TrendingDown size={14}/> Jami: {fmt(totalAmount)}
                    </div>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button onClick={handleExcel} disabled={exporting}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 14px', borderRadius: 9,
                            cursor: exporting ? 'not-allowed' : 'pointer',
                            border: '1.5px solid var(--card-border)', background: 'var(--input-bg)',
                            color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600,
                            opacity: exporting ? 0.6 : 1, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!exporting) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; } }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >
                        <Download size={14}/>{exporting ? 'Yuklanmoqda...' : 'Excel'}
                    </button>

                    <button className="btn-refresh" onClick={refetch} title="Yangilash">
                        <RefreshCw size={15}/>
                    </button>

                    <button onClick={() => setCreateOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 9, border: 'none',
                            background: 'var(--accent)', color: '#fff',
                            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        }}>
                        <Plus size={15}/> Xarajat qo'shish
                    </button>
                </div>
            </div>

            {/* Content */}
            {isLoading && <Loading/>}
            {error && (
                <div style={{ color: 'var(--danger)', padding: 12, background: 'var(--danger-soft)', borderRadius: 10 }}>
                    Xatolik: {error?.data?.message}
                </div>
            )}

            {!isLoading && !error && (
                records.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                        <TrendingDown size={48} style={{ opacity: .2, margin: '0 auto 12px', display: 'block' }}/>
                        <p>Xarajatlar mavjud emas</p>
                    
                    </div>
                ) : (
                    <>
                        <div className="data-table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>№</th>
                                        <th>Sana</th>
                                        <th>Kategoriya</th>
                                        <th>Summa</th>
                                        <th>Izoh</th>
                                        <th>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((e, i) => (
                                        <tr key={e.id}>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                                                {(currPage - 1) * 15 + i + 1}
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                                                {fmtDate(e.date)}
                                            </td>
                                            <td>
                                                {e.category ? (
                                                    <span style={{
                                                        fontSize: '0.72rem', fontWeight: 600,
                                                        padding: '3px 10px', borderRadius: 99,
                                                        background: 'var(--accent-soft)', color: 'var(--accent)',
                                                    }}>
                                                        {e.category}
                                                    </span>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                            </td>
                                            <td style={{ color: 'var(--danger)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {fmt(e.amount)}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {e.comment || '—'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="action-btn" onClick={() => setEditItem(e)} title="Tahrirlash">
                                                        <Pencil size={13}/>
                                                    </button>
                                                    <button className="action-btn action-btn-danger" onClick={() => setDeleteItem(e)} title="O'chirish">
                                                        <Trash2 size={13}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination">
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {totalCount > 0 && `Jami ${totalCount} ta xarajat`}
                            </span>
                            <div className="pagination-controls">
                                <button className="page-btn" onClick={() => setPage(1)} disabled={currPage <= 1}><ChevronsLeft size={15}/></button>
                                <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={currPage <= 1}><ChevronLeft size={15}/></button>
                                <span className="page-info">{currPage} / {totalPages}</span>
                                <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={currPage >= totalPages}><ChevronRight size={15}/></button>
                                <button className="page-btn" onClick={() => setPage(totalPages)} disabled={currPage >= totalPages}><ChevronsRight size={15}/></button>
                            </div>
                        </div>
                    </>
                )
            )}

            {/* Modals */}
            <ExpenseModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                expense={null}
                onSuccess={refetch}
            />
            {editItem && (
                <ExpenseModal
                    open={!!editItem}
                    onClose={() => setEditItem(null)}
                    expense={editItem}
                    onSuccess={() => { refetch(); setEditItem(null); }}
                />
            )}
            {deleteItem && (
                <DeleteModal
                    open={!!deleteItem}
                    onClose={() => setDeleteItem(null)}
                    expense={deleteItem}
                    onSuccess={() => { refetch(); setDeleteItem(null); }}
                />
            )}
        </div>
    );
}
