import { useState, useEffect, useMemo } from 'react';
import { useLazyGetGroupEntryExitQuery } from '../../../../store/services/student-attendance.api';
import { LogIn, LogOut, Calendar, X } from 'lucide-react';
import Loading from '../../../Other/UI/Loadings/Loading';

export default function EntryExitTab({ groupId }) {
    // Bugungi kun uchun
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);
    
    const [fetchEntryExit, { data, isLoading, error }] = useLazyGetGroupEntryExitQuery();

    useEffect(() => {
        if (groupId) {
            fetchEntryExit({ group_id: groupId, startDate: today, endDate: today });
        }
    }, [groupId, today, fetchEntryExit]);

    // Parse response data
    const entryExitData = useMemo(() => {
        if (!data) return [];
        
        // Try different response structures
        if (data.students) return data.students;
        if (data.data?.students) return data.data.students;
        if (Array.isArray(data)) return data;
        
        return [];
    }, [data]);

    const todayDate = useMemo(() => {
        const d = new Date();
        return d.toLocaleDateString('uz-UZ', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            weekday: 'long'
        });
    }, []);

    if (isLoading) return <Loading />;

    if (error) {
        return (
            <div style={{
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: 16,
                borderRadius: 12,
                fontSize: '0.85rem'
            }}>
                Xatolik: {error?.data?.message || 'Ma\'lumotlarni yuklashda xatolik'}
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20
            }}>
                <Calendar size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {todayDate}
                </span>
            </div>

            {/* Table */}
            {!entryExitData.length ? (
                <div style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 12
                }}>
                    Bugun uchun ma'lumotlar topilmadi
                </div>
            ) : (
                <AttendanceTable students={entryExitData} />
            )}
        </div>
    );
}

function AttendanceTable({ students }) {
    return (
        <div style={{ 
            overflowX: 'auto',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 12
        }}>
            <table style={{ 
                width: '100%', 
                borderCollapse: 'separate',
                borderSpacing: 0,
                fontSize: '0.8rem'
            }}>
                <thead>
                    <tr style={{ background: 'var(--input-bg)' }}>
                        <th style={{
                            padding: '14px 18px',
                            textAlign: 'left',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            borderBottom: '2px solid var(--card-border)',
                            fontSize: '0.82rem'
                        }}>
                            O'quvchi
                        </th>
                        <th style={{
                            padding: '14px 18px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            borderBottom: '2px solid var(--card-border)',
                            width: 180,
                            fontSize: '0.82rem'
                        }}>
                            Kirdi
                        </th>
                        <th style={{
                            padding: '14px 18px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            borderBottom: '2px solid var(--card-border)',
                            width: 180,
                            fontSize: '0.82rem'
                        }}>
                            Chiqdi
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student, idx) => {
                        const day = student.days?.[0] || { came: false, first_in: null, last_out: null };
                        
                        return (
                            <tr 
                                key={student.student_id}
                                style={{ 
                                    background: idx % 2 === 0 ? 'var(--card-bg)' : 'var(--input-bg)',
                                }}
                            >
                                <td style={{
                                    padding: '12px 18px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                    borderBottom: '1px solid var(--card-border)',
                                    fontSize: '0.82rem'
                                }}>
                                    {student.full_name}
                                </td>
                                <td style={{
                                    padding: '12px 18px',
                                    textAlign: 'center',
                                    borderBottom: '1px solid var(--card-border)'
                                }}>
                                    {day.came && day.first_in ? (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 12px',
                                            background: 'var(--success-soft)',
                                            border: '1px solid var(--success)',
                                            borderRadius: 8,
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: 'var(--success)'
                                        }}>
                                            <LogIn size={14} />
                                            {day.first_in}
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            background: 'var(--danger-soft)',
                                            border: '1px solid var(--danger)',
                                            color: 'var(--danger)',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            <X size={16} />
                                        </div>
                                    )}
                                </td>
                                <td style={{
                                    padding: '12px 18px',
                                    textAlign: 'center',
                                    borderBottom: '1px solid var(--card-border)'
                                }}>
                                    {day.came && day.last_out ? (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '6px 12px',
                                            background: 'var(--warning-soft)',
                                            border: '1px solid var(--warning)',
                                            borderRadius: 8,
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: 'var(--warning)'
                                        }}>
                                            <LogOut size={14} />
                                            {day.last_out}
                                        </div>
                                    ) : day.came ? (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px 10px',
                                            borderRadius: 6,
                                            background: 'var(--accent-soft)',
                                            border: '1px solid var(--accent)',
                                            color: 'var(--accent)',
                                            fontSize: '0.7rem',
                                            fontWeight: 600
                                        }}>
                                            Ichkarida
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            background: 'var(--danger-soft)',
                                            border: '1px solid var(--danger)',
                                            color: 'var(--danger)',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            <X size={16} />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
