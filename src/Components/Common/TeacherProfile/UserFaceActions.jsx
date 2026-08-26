import { useState, useRef } from 'react';
import { useUploadUserFaceMutation, useDeleteUserFaceMutation } from '../../../store/services/hikvision.api';
import { Camera, Trash, AlertTriangle } from 'lucide-react';
import { Alert } from '../../Other/UI/Alert/Alert';
import Modal from '../../Other/UI/Modal/Modal';

/**
 * hasFace — hikvision_code mavjudligini bildiradi
 * true  → faqat "Yuzni o'chirish" tugmasi
 * false → faqat "Yuz qo'shish" tugmasi
 */
export default function UserFaceActions({ userId, userName, hasFace = false }) {
    const [uploadOpen, setUploadOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [preview,    setPreview]    = useState(null);
    const [file,       setFile]       = useState(null);
    const fileRef = useRef(null);

    const [uploadUserFace, { isLoading: uploading }] = useUploadUserFaceMutation();
    const [deleteUserFace, { isLoading: deleting  }] = useDeleteUserFaceMutation();

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(f);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) { Alert('Rasm tanlang', 'error'); return; }
        try {
            await uploadUserFace({ user_id: userId, photo: file }).unwrap();
            Alert('Yuz muvaffaqiyatli yuklandi', 'success');
            setUploadOpen(false);
            setFile(null); setPreview(null);
        } catch (err) {
            Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteUserFace(userId).unwrap();
            Alert("Yuz ma'lumoti o'chirildi", 'success');
            setDeleteOpen(false);
        } catch (err) {
            Alert(err?.data?.message || 'Xatolik yuz berdi', 'error');
        }
    };

    return (
        <>
            {hasFace ? (
                <button
                    onClick={() => setDeleteOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1.5px solid var(--danger)', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <Trash size={14} /> Yuzni o'chirish
                </button>
            ) : (
                <button
                    onClick={() => { setUploadOpen(true); setFile(null); setPreview(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1.5px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    <Camera size={14} /> Yuz qo'shish
                </button>
            )}

            {/* Upload Modal */}
            <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Yuz rasmini yuklash" size="sm">
                <form onSubmit={handleUpload}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong> uchun yuz rasmi yuklang.
                        </p>

                        {preview ? (
                            <div style={{ textAlign: 'center' }}>
                                <img src={preview} alt="preview"
                                    style={{ width: 140, height: 140, borderRadius: 12, objectFit: 'cover', border: '2px solid var(--card-border)' }} />
                            </div>
                        ) : (
                            <div
                                onClick={() => fileRef.current?.click()}
                                style={{ height: 120, border: '2px dashed var(--card-border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: 'var(--input-bg)', transition: 'border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--card-border)'}
                            >
                                <Camera size={28} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Rasm tanlash uchun bosing</span>
                            </div>
                        )}

                        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

                        {file && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{file.name}</span>
                                <button type="button"
                                    onClick={() => { setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.78rem' }}>
                                    Olib tashlash
                                </button>
                            </div>
                        )}

                        {preview && (
                            <button type="button" onClick={() => fileRef.current?.click()}
                                style={{ background: 'var(--input-bg)', border: '1.5px solid var(--card-border)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                Boshqa rasm tanlash
                            </button>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setUploadOpen(false)}>Bekor qilish</button>
                        <button type="submit" className="btn-submit" disabled={uploading || !file}>
                            <Camera size={13} /> {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Yuz ma'lumotini o'chirish" size="sm">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '4px 0 8px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                            <strong style={{ color: 'var(--danger)' }}>{userName}</strong> ning yuz ma'lumotini o'chirmoqchisiz.
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bu amalni qaytarib bo'lmaydi.</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={() => setDeleteOpen(false)}>Bekor qilish</button>
                    <button className="btn-delete" onClick={handleDelete} disabled={deleting}>
                        <Trash size={13} /> {deleting ? "O'chirilmoqda..." : "O'chirish"}
                    </button>
                </div>
            </Modal>
        </>
    );
}
