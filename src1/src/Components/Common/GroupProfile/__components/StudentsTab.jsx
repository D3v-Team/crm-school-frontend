// StudentTab.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Typography,
  Spinner,
  Chip,
  Button,
} from '@material-tailwind/react';
import { Users, Calendar, RefreshCw, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useLazyGetGroupDebtorsQuery } from '../../../../store/services/payment.api';

const MONTHS = [
  { value: 1, label: 'Yanvar' },
  { value: 2, label: 'Fevral' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Aprel' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Iyun' },
  { value: 7, label: 'Iyul' },
  { value: 8, label: 'Avgust' },
  { value: 9, label: 'Sentyabr' },
  { value: 10, label: 'Oktyabr' },
  { value: 11, label: 'Noyabr' },
  { value: 12, label: 'Dekabr' },
];

const formatPrice = (value) => {
  if (value === undefined || value === null || isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('ru-RU') + ' so‘m';
};

export default function StudentTab({ students = [] }) {
  const { id: groupId } = useParams();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [fetchDebtors, { data, isLoading, isFetching, error }] = useLazyGetGroupDebtorsQuery();

  useEffect(() => {
    if (groupId) {
      fetchDebtors({ group_id: groupId, year, month });
    }
  }, [groupId, year, month, fetchDebtors]);

  const handleRefresh = () => {
    if (groupId) {
      fetchDebtors({ group_id: groupId, year, month });
    }
  };

  const debtorsMap = useMemo(() => {
    const list = Array.isArray(data?.data?.students)
      ? data.data.students
      : Array.isArray(data?.students)
        ? data.students
        : [];
    return list.reduce((acc, item) => {
      acc[item.student_id] = item;
      return acc;
    }, {});
  }, [data]);

  const finalList = useMemo(() => {
    return students.map((student) => {
      const price = Number(student.price) || 0;
      const debtInfo = debtorsMap[student.id];

      if (debtInfo) {
        return {
          student_id: student.id,
          full_name: student.full_name,
          phone: student.phone || '—',
          payment_id: debtInfo.payment_id,
          required_amount: Number(debtInfo.required_amount) || price,
          paid_amount: Number(debtInfo.paid_amount) || 0,
          debt: Number(debtInfo.debt) || 0,
        };
      }

      return {
        student_id: student.id,
        full_name: student.full_name,
        phone: student.phone || '—',
        payment_id: null,
        required_amount: price,
        paid_amount: price,
        debt: 0,
      };
    });
  }, [students, debtorsMap]);

  const sortedList = useMemo(() => {
    return [...finalList].sort((a, b) => b.debt - a.debt);
  }, [finalList]);

  const totals = useMemo(() => {
    return finalList.reduce(
      (acc, item) => {
        acc.total_required += item.required_amount || 0;
        acc.total_paid += item.paid_amount || 0;
        acc.total_debt += item.debt || 0;
        return acc;
      },
      { total_required: 0, total_paid: 0, total_debt: 0 }
    );
  }, [finalList]);

  const paidPercent = totals.total_required > 0
    ? Math.min(100, Math.round((totals.total_paid / totals.total_required) * 100))
    : 0;

  const getStatusBadge = (debt, required) => {
    if (required === 0) {
      return <Chip size="sm" value="Noma'lum" color="gray" className="text-xs w-fit" />;
    }
    if (debt <= 0) {
      return <Chip size="sm" value="To‘liq to‘langan" color="green" className="text-xs w-fit" />;
    }
    return <Chip size="sm" value="Qarzdor" color="red" className="text-xs w-fit" />;
  };

  const showLoading = isLoading || isFetching;

  if (error) {
    return (
      <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        Xatolik: {error?.data?.message || "Noma'lum xatolik"}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Фильтры */}
      <div className="flex flex-wrap gap-4 bg-card p-4 rounded-xl border border-border/60">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <Typography variant="h6" className="text-text-primary font-semibold">
            To‘lov holati
          </Typography>
        </div>
        <div className="flex-1 flex flex-wrap gap-3">
          <div className="w-28">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors text-sm"
            >
              {Array.from({ length: 7 }, (_, i) => currentYear - 3 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border-2 bg-input-bg border-input-border text-input-text focus:border-accent focus:outline-none transition-colors text-sm"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            className="bg-accent hover:bg-accent-hover text-white flex items-center gap-2 mt-1"
            onClick={handleRefresh}
            disabled={showLoading}
          >
            <RefreshCw size={14} className={showLoading ? 'animate-spin' : ''} /> Yangilash
          </Button>
        </div>
      </div>

      {showLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-8 w-8 text-accent" />
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-input-bg/30 rounded-xl border border-border/40">
          <Users className="w-16 h-16 text-text-secondary/30 mb-3" />
          <Typography className="text-text-secondary text-base font-medium">
            Ma'lumotlar mavjud emas
          </Typography>
          <Typography className="text-text-secondary text-sm mt-1">
            Guruhda hali o‘quvchilar mavjud emas
          </Typography>
        </div>
      ) : (
        <>
          {/* Итоговые карточки */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Wallet className="text-blue-500" size={22} />
              </div>
              <div>
                <Typography className="text-text-secondary text-xs">Jami kerak</Typography>
                <Typography className="text-text-primary text-lg font-bold leading-tight">
                  {formatPrice(totals.total_required)}
                </Typography>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-500/10">
                <TrendingUp className="text-green-500" size={22} />
              </div>
              <div>
                <Typography className="text-text-secondary text-xs">Jami to‘langan</Typography>
                <Typography className="text-green-600 text-lg font-bold leading-tight">
                  {formatPrice(totals.total_paid)}
                </Typography>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10">
                <TrendingDown className="text-red-500" size={22} />
              </div>
              <div>
                <Typography className="text-text-secondary text-xs">Jami qarz</Typography>
                <Typography className="text-red-500 text-lg font-bold leading-tight">
                  {formatPrice(totals.total_debt)}
                </Typography>
              </div>
            </div>
          </div>

          {/* Общий прогресс */}
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Typography className="text-text-secondary text-sm font-medium">
                Umumiy to‘lov foizi
              </Typography>
              <Typography className="text-text-primary text-sm font-bold">
                {paidPercent}%
              </Typography>
            </div>
            <div className="h-2.5 w-full rounded-full bg-input-bg overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  paidPercent >= 100 ? 'bg-green-500' : paidPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>

          {/* Таблица */}
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/50 shadow-sm">
            <table className="w-full text-sm text-text-primary border-collapse">
              <thead>
                <tr className="bg-input-bg/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">№</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">F.I.O</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Telefon</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Kerakli</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">To‘langan</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Qarz</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary min-w-[140px]">Progress</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Holat</th>
                </tr>
              </thead>
              <tbody>
                {sortedList.map((item, index) => {
                  const percent = item.required_amount > 0
                    ? Math.min(100, Math.round((item.paid_amount / item.required_amount) * 100))
                    : 0;
                  return (
                    <tr
                      key={item.student_id || index}
                      className="border-b border-border/40 hover:bg-input-bg/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3 font-medium">
                        <Link
                          to={`/student/${item.student_id}`}
                          className="text-text-primary hover:text-accent transition-colors hover:underline"
                        >
                          {item.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{item.phone}</td>
                      <td className="px-4 py-3">{formatPrice(item.required_amount)}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{formatPrice(item.paid_amount)}</td>
                      <td className={`px-4 py-3 font-semibold ${item.debt > 0 ? 'text-red-500' : 'text-text-secondary'}`}>
                        {item.debt > 0 ? formatPrice(item.debt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-input-bg overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percent >= 100 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary w-8">{percent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item.debt, item.required_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-accent/5 border-t-2 border-accent/20">
                  <td colSpan="3" className="px-4 py-3 text-right font-bold text-text-primary">
                    Jami:
                  </td>
                  <td className="px-4 py-3 font-bold text-text-primary">
                    {formatPrice(totals.total_required)}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {formatPrice(totals.total_paid)}
                  </td>
                  <td className="px-4 py-3 font-bold text-red-500">
                    {formatPrice(totals.total_debt)}
                  </td>
                  <td className="px-4 py-3" colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}