// =================================================================
// DOSYA: src/components/SalaryCalculator.js
// AÇIKLAMA: Brüt/Net maaş hesaplayıcı component'i.
// *** GÜNCELLENDİ: Parametreler 2025 yılı resmi verileriyle ve
// sağlanan Excel mantığına göre güncellendi. ***
// =================================================================
import React, { useState, useEffect } from 'react';

const SalaryCalculator = ({ styles }) => {
  const [calculationType, setCalculationType] = useState('grossToNet');
  const [salaryInput, setSalaryInput] = useState('');
  const [engellilikDurumu, setEngellilikDurumu] = useState('yok');
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [yearlyTotals, setYearlyTotals] = useState(null);

  const formatLocale = (number) => {
    if (typeof number !== 'number') return '0,00';
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const rawValue = value.replace(/\./g, '');
    if (/^[\d,]*$/.test(rawValue)) {
      const parts = rawValue.split(',');
      const integerPart = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      const formattedValue = parts.length > 1 ? `${integerPart},${parts[1].slice(0, 2)}` : integerPart;
      setSalaryInput(formattedValue);
    }
  };

  useEffect(() => {
    const calculate = () => {
      const pSalaryInput = parseFloat(salaryInput.replace(/\./g, '').replace(',', '.')) || 0;
      if (pSalaryInput === 0) {
        setMonthlyBreakdown([]);
        setYearlyTotals(null);
        return;
      }

      // --- 2025 Yılı Resmi Parametreleri ---
      const ASGARI_UCRET_BRUT = 26005.50;
      const SGK_TAVAN = ASGARI_UCRET_BRUT * 7.5;
      const ENGELLILIK_INDIRIMI = { yok: 0, derece1: 6900, derece2: 4000, derece3: 1700 };
      const VERGI_DILIMLERI = [
        { limit: 110000, rate: 0.15 }, { limit: 230000, rate: 0.20 },
        { limit: 870000, rate: 0.27 }, { limit: 3000000, rate: 0.35 },
        { limit: Infinity, rate: 0.40 },
      ];

      const calculateIncomeTax = (matrah, kumulatif) => {
        let tax = 0;
        let remainingMatrah = matrah;
      
        for (const dilim of VERGI_DILIMLERI) {
          if (remainingMatrah <= 0) break;
      
          const dilimBasi = kumulatif > dilim.limit ? dilim.limit : (kumulatif > (dilim.limit - (dilim.limit - (VERGI_DILIMLERI.find(d => d.limit > kumulatif)?.limit || 0))) ? kumulatif : 0);
          const dilimSonu = dilim.limit;
          
          const vergilendirilecekTutar = Math.min(remainingMatrah, dilimSonu - dilimBasi);
      
          if (vergilendirilecekTutar > 0) {
            tax += vergilendirilecekTutar * dilim.rate;
            remainingMatrah -= vergilendirilecekTutar;
          }
        }
        return tax;
      };
      
      const calculateGrossFromNet = (targetNet) => {
        let guessBrut = targetNet * 1.4; 
        let currentNet = 0;
        
        for(let iter = 0; iter < 30; iter++) {
            let tempKumulatif = 0;
            let tempAsgariKumulatif = 0;
            let totalNetForYear = 0;

            // Yıllık neti tahmin etmek için bir ayın netini hesapla
            const sgkIsciPayi = Math.min(guessBrut, SGK_TAVAN) * 0.14;
            const issizlikIsciPayi = Math.min(guessBrut, SGK_TAVAN) * 0.01;
            const gelirVergisiMatrahi = guessBrut - sgkIsciPayi - issizlikIsciPayi;

            const asgariUcretGvMatrahi = ASGARI_UCRET_BRUT - (ASGARI_UCRET_BRUT * 0.14) - (ASGARI_UCRET_BRUT * 0.01);
            const gelirVergisiIstisnasi = calculateIncomeTax(asgariUcretGvMatrahi, 0);
            const damgaVergisiIstisnasi = ASGARI_UCRET_BRUT * 0.00759;

            const hesaplananGelirVergisi = calculateIncomeTax(gelirVergisiMatrahi, 0);
            const nihaiGelirVergisi = Math.max(0, hesaplananGelirVergisi - gelirVergisiIstisnasi);
            const hesaplananDamgaVergisi = guessBrut * 0.00759;
            const nihaiDamgaVergisi = Math.max(0, hesaplananDamgaVergisi - damgaVergisiIstisnasi);
            const toplamKesinti = sgkIsciPayi + issizlikIsciPayi + nihaiGelirVergisi + nihaiDamgaVergisi;
            currentNet = guessBrut - toplamKesinti;

            if (Math.abs(currentNet - targetNet) < 0.01) {
                break;
            }
            guessBrut = guessBrut * (targetNet / currentNet);
        }
        return guessBrut;
      };

      let kumulatif = 0;
      let asgariUcretKumulatif = 0;
      const breakdown = [];
      
      let brutUcret = pSalaryInput;
      if (calculationType === 'netToGross') {
          brutUcret = calculateGrossFromNet(pSalaryInput);
      }

      for (let i = 0; i < 12; i++) {
        const sgkIsciPayi = Math.min(brutUcret, SGK_TAVAN) * 0.14;
        const issizlikIsciPayi = Math.min(brutUcret, SGK_TAVAN) * 0.01;
        const gelirVergisiMatrahi = brutUcret - sgkIsciPayi - issizlikIsciPayi;
        
        const asgariUcretGvMatrahi = ASGARI_UCRET_BRUT - (ASGARI_UCRET_BRUT * 0.14) - (ASGARI_UCRET_BRUT * 0.01);
        const gelirVergisiIstisnasi = calculateIncomeTax(asgariUcretGvMatrahi, asgariUcretKumulatif);
        const damgaVergisiIstisnasi = ASGARI_UCRET_BRUT * 0.00759;

        const engellilikIndirimiTutari = ENGELLILIK_INDIRIMI[engellilikDurumu];
        const indirimliMatrah = Math.max(0, gelirVergisiMatrahi - engellilikIndirimiTutari);
        
        const hesaplananGelirVergisi = calculateIncomeTax(indirimliMatrah, kumulatif);
        const nihaiGelirVergisi = Math.max(0, hesaplananGelirVergisi - gelirVergisiIstisnasi);
        
        const hesaplananDamgaVergisi = brutUcret * 0.00759;
        const nihaiDamgaVergisi = Math.max(0, hesaplananDamgaVergisi - damgaVergisiIstisnasi);
        
        const toplamKesinti = sgkIsciPayi + issizlikIsciPayi + nihaiGelirVergisi + nihaiDamgaVergisi;
        
        const nihaiNetUcret = brutUcret - toplamKesinti;
        
        const sgkIsverenPayi = Math.min(brutUcret, SGK_TAVAN) * 0.155; // 5 puan indirimli
        const issizlikIsverenPayi = Math.min(brutUcret, SGK_TAVAN) * 0.02;
        const isvereneMaliyet = brutUcret + sgkIsverenPayi + issizlikIsverenPayi;

        kumulatif += gelirVergisiMatrahi;
        asgariUcretKumulatif += asgariUcretGvMatrahi;
        
        breakdown.push({
          month: i + 1, brut: brutUcret, sgk: sgkIsciPayi, issizlik: issizlikIsciPayi,
          gelirVergisi: nihaiGelirVergisi, damgaVergisi: nihaiDamgaVergisi,
          kesinti: toplamKesinti, net: nihaiNetUcret, kumulatif, isvereneMaliyet
        });
      }
      setMonthlyBreakdown(breakdown);

      const totals = breakdown.reduce((acc, row) => {
        acc.brut += row.brut; acc.net += row.net; acc.sgk += row.sgk;
        acc.issizlik += row.issizlik; acc.gelirVergisi += row.gelirVergisi;
        acc.damgaVergisi += row.damgaVergisi; acc.isvereneMaliyet += row.isvereneMaliyet;
        return acc;
      }, { brut: 0, net: 0, sgk: 0, issizlik: 0, gelirVergisi: 0, damgaVergisi: 0, isvereneMaliyet: 0 });
      setYearlyTotals(totals);
    };
    calculate();
  }, [salaryInput, calculationType, engellilikDurumu]);

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Brüt/Net Maaş Hesaplama</h2>
      <p style={{...styles.label, fontSize: '12px', fontStyle: 'italic'}}>*Hesaplamalar 2025 yılı resmi parametrelerine göredir.</p>
      
      <div style={styles.toggleContainer}>
        <button onClick={() => setCalculationType('grossToNet')} style={calculationType === 'grossToNet' ? styles.toggleButtonActive : styles.toggleButton}>Brütten Nete</button>
        <button onClick={() => setCalculationType('netToGross')} style={calculationType === 'netToGross' ? styles.toggleButtonActive : styles.toggleButton}>Netten Brüte</button>
      </div>

      <p style={styles.label}>{calculationType === 'grossToNet' ? 'Brüt Ücret' : 'Net Ücret'}</p>
      <input style={styles.input} type="text" placeholder={calculationType === 'grossToNet' ? 'Örn: 100.000' : 'Örn: 75.000'} value={salaryInput} onChange={handleInputChange} />
      
      <p style={styles.label}>Engellilik Durumu</p>
      <select style={styles.input} value={engellilikDurumu} onChange={(e) => setEngellilikDurumu(e.target.value)}>
        <option value="yok">Yok</option>
        <option value="derece3">3. Derece</option>
        <option value="derece2">2. Derece</option>
        <option value="derece1">1. Derece</option>
      </select>
      
      {monthlyBreakdown.length > 0 && (
        <div style={{marginTop: '20px', overflowX: 'auto'}}>
          <h3 style={{...styles.cardTitle, fontSize: '18px'}}>Yıllık Maaş Tablosu</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ay</th><th style={styles.th}>Brüt Maaş</th><th style={styles.th}>Net Maaş</th>
                <th style={styles.th}>SGK</th><th style={styles.th}>İşsizlik</th><th style={styles.th}>Gelir V.</th>
                <th style={styles.th}>Damga V.</th><th style={styles.th}>Kümülatif</th><th style={styles.th}>İşverene Maliyet</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.map(row => (
                <tr key={row.month}>
                  <td style={styles.td}>{row.month}</td><td style={styles.td}>{formatLocale(row.brut)}</td><td style={styles.tdHighlighted}>{formatLocale(row.net)}</td>
                  <td style={styles.td}>{formatLocale(row.sgk)}</td><td style={styles.td}>{formatLocale(row.issizlik)}</td><td style={styles.td}>{formatLocale(row.gelirVergisi)}</td>
                  <td style={styles.td}>{formatLocale(row.damgaVergisi)}</td><td style={styles.td}>{formatLocale(row.kumulatif)}</td><td style={styles.tdHighlighted}>{formatLocale(row.isvereneMaliyet)}</td>
                </tr>
              ))}
            </tbody>
            {yearlyTotals && (
              <tfoot>
                <tr style={styles.tfootTr}>
                  <td style={styles.tfootTd}><b>Toplam</b></td><td style={styles.tfootTd}><b>{formatLocale(yearlyTotals.brut)}</b></td><td style={styles.tfootTd}><b>{formatLocale(yearlyTotals.net)}</b></td>
                  <td style={styles.tfootTd}><b>{formatLocale(yearlyTotals.sgk)}</b></td><td style={styles.tfootTd}><b>{formatLocale(yearlyTotals.issizlik)}</b></td><td style={styles.tfootTd}><b>{formatLocale(yearlyTotals.gelirVergisi)}</b></td>
                  <td style={styles.tfootTd}><b>{formatLocale(yearlyTotals.damgaVergisi)}</b></td><td style={styles.tfootTd}>-</td><td style={styles.tfootTd}><b>{formatLocale(yearlyTotals.isvereneMaliyet)}</b></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};

export default SalaryCalculator;
