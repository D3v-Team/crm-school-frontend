import { useEffect } from 'react';

/**
 * Telefonda jadvallar yonga surilmasin: har bir qator kartochkaga aylanadi (CSS: index.css "jadval → kartochka").
 * Kartochkada har bir qiymat yonida ustun nomi chiqishi uchun har bir <td> ga thead dagi
 * sarlavhani data-label sifatida yozamiz. Sahifalar o'zgarishi shart emas — yangi qator yoki
 * jadval paydo bo'lsa MutationObserver qayta belgilaydi.
 */
export const MOBILE_CARD_TABLES = 'table.data-table, table.tests-table, table.mobile-cards';

const labelTable = (table) => {
    const headRow = table.tHead?.rows?.[0];
    if (!headRow) return;
    const labels = [];
    [...headRow.cells].forEach((th) => {
        const text = th.textContent.trim();
        for (let i = 0; i < (th.colSpan || 1); i += 1) labels.push(text);
    });
    [...table.tBodies].forEach((tbody) => {
        [...tbody.rows].forEach((row) => {
            let column = 0;
            [...row.cells].forEach((cell) => {
                const span = cell.colSpan || 1;
                // Bir nechta ustunni egallagan katak ("Ma'lumot topilmadi" kabi) — butun kenglikda
                const label = span > 1 ? '' : (labels[column] || '');
                if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label);
                if (span > 1) cell.setAttribute('data-full', '');
                else if (cell.hasAttribute('data-full')) cell.removeAttribute('data-full');
                column += span;
            });
        });
    });
};

export const labelAllTables = (root = document) => root.querySelectorAll(MOBILE_CARD_TABLES).forEach(labelTable);

export default function useMobileTableCards() {
    useEffect(() => {
        let frame = 0;
        const schedule = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => { frame = 0; labelAllTables(); });
        };
        labelAllTables();
        // Faqat childList kuzatiladi — data-label yozish (atribut) observerni qayta chaqirmaydi
        const observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });
        return () => {
            observer.disconnect();
            if (frame) window.cancelAnimationFrame(frame);
        };
    }, []);
}
