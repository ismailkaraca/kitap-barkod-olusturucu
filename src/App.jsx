import React from 'react';

// Gerekli kütüphaneleri yüklemek için script etiketleri ekliyoruz.
const tailwindScript = document.createElement('script');
tailwindScript.src = "https://cdn.tailwindcss.com";
document.head.appendChild(tailwindScript);

const papaParseScript = document.createElement('script');
papaParseScript.src = "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js";
papaParseScript.async = true;
document.head.appendChild(papaParseScript);

const sheetJsScript = document.createElement('script');
sheetJsScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
sheetJsScript.async = true;
document.head.appendChild(sheetJsScript);

const jsBarcodeScript = document.createElement('script');
jsBarcodeScript.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js";
jsBarcodeScript.async = true;
document.head.appendChild(jsBarcodeScript);

const jsPdfScript = document.createElement('script');
jsPdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
jsPdfScript.async = true;
document.head.appendChild(jsPdfScript);

const html2canvasScript = document.createElement('script');
html2canvasScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
html2canvasScript.async = true;
document.head.appendChild(html2canvasScript);

// QR Kod için eklendi
const qrCodeScript = document.createElement('script');
qrCodeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
qrCodeScript.async = true;
document.head.appendChild(qrCodeScript);


// --- Yardımcı Bileşenler ---

const Barcode = ({ text }) => {
  const svgRef = React.useRef(null);
  React.useEffect(() => {
    if (svgRef.current && text && window.JsBarcode) {
      try {
        const barcodeValue = String(text).slice(0, 12);
        window.JsBarcode(svgRef.current, barcodeValue, {
          format: "CODE128", displayValue: true, text: barcodeValue,
          textPosition: "bottom", fontSize: 12, textMargin: 2,
          height: 35, width: 1.5, margin: 2
        });
      } catch (e) { console.error(`JsBarcode hatası: Barkod "${text}" oluşturulamadı.`, e); }
    }
  }, [text]);
  return <svg ref={svgRef} />;
};

const QRCode = ({ text, size = '25mm' }) => {
  const qrRef = React.useRef(null);
  React.useEffect(() => {
    if (qrRef.current && text && window.qrcode) {
      qrRef.current.innerHTML = '';
      try {
        const typeNumber = 0; // Auto-detect
        const errorCorrectionLevel = 'L';
        const qr = window.qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(String(text));
        qr.make();
        qrRef.current.innerHTML = qr.createSvgTag({ cellSize: 2, margin: 0 });
        const svg = qrRef.current.querySelector('svg');
        if (svg) {
          svg.style.width = '100%'; svg.style.height = '100%';
          svg.removeAttribute('width'); svg.removeAttribute('height');
        }
      } catch (e) { console.error("QR Code generation failed for text:", text, e); }
    }
  }, [text]);
  return <div ref={qrRef} style={{ width: size, height: size, margin: 'auto' }} />;
};


// --- Şablon ve Veri Tanımları ---
const templates = {
  system4: { name: "Barkod Şablonu (Sistem) 4'lü", pageWidth: 210, pageHeight: 297, unit: 'mm', labelWidth: 46, labelHeight: 22, marginTop: 13, marginLeft: 7, numCols: 4, numRows: 13, colGap: 3, rowGap: 0 },
  system3: { name: "Barkod Şablonu (Sistem) 3'lü", pageWidth: 210, pageHeight: 297, unit: 'mm', labelWidth: 69, labelHeight: 25, marginTop: 10, marginLeft: 1.5, numCols: 3, numRows: 11, colGap: 0, rowGap: 0 },
  custom: { name: 'Özel Ayarlar', pageWidth: 210, pageHeight: 297, unit: 'mm', labelWidth: 46, labelHeight: 22, marginTop: 13, marginLeft: 7, numCols: 4, numRows: 13, colGap: 3, rowGap: 0 },
};

const availableFields = [ { key: 'itemcallnumber', label: 'Yer Numarası' }, { key: 'title', label: 'Başlık' }, { key: 'author', label: 'Yazar' }, { key: 'isbn', label: 'ISBN' }, { key: 'issn', label: 'ISSN' }, { key: 'itemtype', label: 'Materyal Türü' }, { key: 'homebranch_description', label: 'Ana Kütüphane' }, { key: 'branches.branchnane', label: 'Şube Adı' }, { key: 'location', label: 'Konum' }];
const deweyCategories = { '': 'Yer Numarasına Göre Seç...', '0': '000 - Genel Konular', '1': '100 - Felsefe & Psikoloji', '2': '200 - Din', '3': '300 - Toplum Bilimleri', '4': '400 - Dil ve Dil Bilim', '5': '500 - Doğa Bilimleri & Matematik', '6': '600 - Teknoloji', '7': '700 - Sanat', '8': '800 - Edebiyat', '9': '900 - Coğrafya & Tarih' };

// Ayar etiketleri için Türkçe çeviriler
const settingLabels = {
  pageWidth: 'Sayfa Genişliği',
  pageHeight: 'Sayfa Yüksekliği',
  labelWidth: 'Etiket Genişliği',
  labelHeight: 'Etiket Yüksekliği',
  marginTop: 'Üst Boşluk',
  marginLeft: 'Sol Boşluk',
  numCols: 'Sütun Sayısı',
  numRows: 'Satır Sayısı',
  colGap: 'Sütun Aralığı',
  rowGap: 'Satır Aralığı'
};

// --- Ana Uygulama Bileşeni ---
function App() {
  // --- STATE YÖNETİMİ ---
  const [allData, setAllData] = React.useState([]);
  const [fileName, setFileName] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [selectedBarcodes, setSelectedBarcodes] = React.useState(new Set());
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [settings, setSettings] = React.useState(templates.system4);
  const [selectedTemplateKey, setSelectedTemplateKey] = React.useState('system4');
  const [sortConfig, setSortConfig] = React.useState({ key: 'barcode', direction: 'ascending' });
  const [pdfFileName, setPdfFileName] = React.useState('etiketler');
  
  // Etiket Tasarım State'leri
  const [labelFields, setLabelFields] = React.useState(['itemcallnumber', 'title']);
  const [textAlign, setTextAlign] = React.useState('left');
  const [fontSize, setFontSize] = React.useState(6);
  const [logo, setLogo] = React.useState('/ktb-logo.png'); // <-- DEĞİŞTİ
  const [useMinistryLogo, setUseMinistryLogo] = React.useState(true);
  const [logoSize, setLogoSize] = React.useState(7);

  // YENİ EKLENEN STATE'LER
  const [customTemplates, setCustomTemplates] = React.useState({});
  const [newTemplateName, setNewTemplateName] = React.useState("");
  const [startBarcode, setStartBarcode] = React.useState("");
  const [endBarcode, setEndBarcode] = React.useState("");
  const [barcodeFormat, setBarcodeFormat] = React.useState('CODE128');
  const [fontFamily, setFontFamily] = React.useState('sans-serif');
  const [isFirstLineBold, setIsFirstLineBold] = React.useState(true);
  const [customText, setCustomText] = React.useState("");

  const tableHeaders = [ { key: 'barcode', label: 'Barkod' }, { key: 'title', label: 'Başlık' }, { key: 'author', label: 'Yazar' }, { key: 'itemcallnumber', label: 'Yer Numarası' }, { key: 'itemtype', label: 'Materyal Türü' }, { key: 'location', label: 'Bölümü' }];
  const itemsPerPage = React.useMemo(() => Math.max(1, settings.numCols * settings.numRows), [settings.numCols, settings.rows]);
  // --- EFFECT'LER ---
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('kohaLabelMaker_customTemplates');
      if (saved) setCustomTemplates(JSON.parse(saved));
    } catch (e) { console.error("Özel şablonlar yüklenemedi", e); }
    
    try {
      const savedSelection = sessionStorage.getItem('kohaLabelMaker_selectedBarcodes');
      if (savedSelection) setSelectedBarcodes(new Set(JSON.parse(savedSelection)));
    } catch(e) { console.error("Seçimler yüklenemedi", e); }
  }, []);

  React.useEffect(() => {
    try {
      sessionStorage.setItem('kohaLabelMaker_selectedBarcodes', JSON.stringify(Array.from(selectedBarcodes)));
    } catch (e) { console.error("Seçimler kaydedilemedi", e); }
  }, [selectedBarcodes]);

  // --- TÜRETİLMİŞ STATE'LER ---
  const labelsToPrint = React.useMemo(() => allData.filter(item => selectedBarcodes.has(item.barcode)).sort((a, b) => a.barcode.localeCompare(b.barcode)), [allData, selectedBarcodes]);
  const filteredData = React.useMemo(() => allData.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))), [allData, searchTerm]);
  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] || ''; const valB = b[sortConfig.key] || '';
        if (typeof valA === 'string' && typeof valB === 'string') return sortConfig.direction === 'ascending' ? valA.localeCompare(valB, undefined, {numeric: true}) : valB.localeCompare(valA, undefined, {numeric: true});
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);
  const paginatedData = React.useMemo(() => { const startIndex = (currentPage - 1) * itemsPerPage; return sortedData.slice(startIndex, startIndex + itemsPerPage); }, [sortedData, currentPage, itemsPerPage]);
  const uniqueLocations = React.useMemo(() => Array.from(new Set(allData.map(item => item.location).filter(Boolean))).sort(), [allData]);

  // --- İŞLEVLER (Callbacks ile sarmalandı) ---
  const handlePrintAsPdf = React.useCallback(() => {
    const printArea = document.getElementById('print-area');
    const { jsPDF } = window.jspdf;
    if (printArea && window.html2canvas && jsPDF) {
      window.html2canvas(printArea, { scale: 3 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        const baseFileName = pdfFileName.trim() || 'etiketler';
        const dt = new Date();
        const dateTimeString = `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}_${String(dt.getHours()).padStart(2,'0')}.${String(dt.getMinutes()).padStart(2,'0')}.${String(dt.getSeconds()).padStart(2,'0')}`;
        pdf.save(`${baseFileName}_${dateTimeString}.pdf`);
      });
    } else { alert("PDF kütüphaneleri yüklenemedi."); }
  }, [pdfFileName]);

  const updateSelection = (barcodesToUpdate, shouldSelect) => { setSelectedBarcodes(prev => { const newSet = new Set(prev); barcodesToUpdate.forEach(b => { if (shouldSelect) newSet.add(b); else newSet.delete(b); }); return newSet; }); };
  const handleSelectAllFiltered = React.useCallback(() => updateSelection(filteredData.map(item => item.barcode), true), [filteredData]);
  const handleDeselectAllFiltered = React.useCallback(() => updateSelection(filteredData.map(item => item.barcode), false), [filteredData]);
  
  // Klavye Kısayolları
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); handlePrintAsPdf(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'a') { e.preventDefault(); handleSelectAllFiltered(); }
      if (e.key === 'Escape') { e.preventDefault(); handleDeselectAllFiltered(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrintAsPdf, handleSelectAllFiltered, handleDeselectAllFiltered]);

  const handleFileChange = (event) => {
    const file = event.target.files[0]; if (!file) return;
    setFileName(file.name); setErrorMessage(''); setAllData([]); setSelectedBarcodes(new Set());
    const processData = (data) => { if (data.length > 0 && data[0].barcode !== undefined) { setAllData(data.map(row => ({ ...row, barcode: String(row.barcode) }))); } else { setErrorMessage('Dosyada "barcode" sütunu bulunamadı.'); } };
    if (file.name.endsWith('.csv')) { window.Papa.parse(file, { header: true, skipEmptyLines: true, complete: res => processData(res.data) }); } 
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => { const wb = window.XLSX.read(e.target.result, { type: 'binary' }); processData(window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])); };
      reader.readAsBinaryString(file);
    } else { setErrorMessage('Desteklenmeyen dosya türü.'); }
  };
  
  const handleFieldSelection = (e) => {
    const { value, checked } = e.target;
    setLabelFields(prev => {
        if (checked) { return prev.length < 3 ? [...prev, value] : prev; } 
        else { return prev.filter(field => field !== value); }
    });
  };

  const handleSelectByRange = () => {
    if (!startBarcode || !endBarcode) { alert("Lütfen başlangıç ve bitiş barkodlarını girin."); return; }
    const barcodesToSelect = allData.filter(item => item.barcode.localeCompare(startBarcode) >= 0 && item.barcode.localeCompare(endBarcode) <= 0).map(item => item.barcode);
    updateSelection(barcodesToSelect, true);
  };
  
  const handleSaveTemplate = () => {
    if (!newTemplateName.trim()) { alert("Lütfen şablon için bir isim girin."); return; }
    const newTemplates = { ...customTemplates, [newTemplateName]: settings };
    setCustomTemplates(newTemplates);
    localStorage.setItem('kohaLabelMaker_customTemplates', JSON.stringify(newTemplates));
    setNewTemplateName('');
  };

  const handleDeleteTemplate = (templateName) => {
    const newTemplates = { ...customTemplates };
    delete newTemplates[templateName];
    setCustomTemplates(newTemplates);
    localStorage.setItem('kohaLabelMaker_customTemplates', JSON.stringify(newTemplates));
  };
  
  // Diğer Handler'lar...
  const loadTemplate = (key) => { setSelectedTemplateKey(key); if (key !== 'custom' && key !== 'load_custom') setSettings(templates[key] || templates.custom); };
  const handleSettingChange = (field, value) => { const newSettings = { ...settings, [field]: Number(value) }; setSettings(newSettings); setSelectedTemplateKey('custom'); templates.custom = { ...templates.custom, ...newSettings }; };
  const requestSort = (key) => { setSortConfig(c => ({ key, direction: c.key === key && c.direction === 'ascending' ? 'descending' : 'ascending' })); setCurrentPage(1); };
  const handleSelectPage = () => updateSelection(paginatedData.map(item => item.barcode), true);
  const handleDeselectPage = () => updateSelection(paginatedData.map(item => item.barcode), false);
  const handleLocationSelect = (e) => { const loc = e.target.value; if (!loc) return; updateSelection(allData.filter(i => i.location === loc).map(i => i.barcode), true); e.target.value = ''; };
  const handleDeweySelect = (e) => { const prefix = e.target.value; if (!prefix) return; updateSelection(allData.filter(i => i.itemcallnumber && String(i.itemcallnumber).startsWith(prefix)).map(i => i.barcode), true); e.target.value = ''; };
  const handleLogoChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => { setLogo(ev.target.result); setUseMinistryLogo(false); }; reader.readAsDataURL(file); }};
  const handleMinistryLogoToggle = (e) => { setUseMinistryLogo(e.target.checked); setLogo(e.target.checked ? '/ktb-logo.png' : null); }; // <-- DEĞİŞTİ

  // --- RENDER Fonksiyonları ---
  const renderSingleLabel = (data, key) => (
    <div className="flex flex-col text-black h-full box-border">
        <div className="flex items-start flex-grow" style={{ paddingTop: '1mm', paddingLeft: '1mm', paddingRight: '1mm' }}>
            {logo && <img src={logo} alt="logo" className="flex-shrink-0" style={{ height: `${logoSize}mm`, width: 'auto', marginRight: '2mm' }} />}
            <div className="flex-grow" style={{ textAlign: textAlign, fontSize: `${fontSize}pt`, lineHeight: '1.2', fontFamily: fontFamily }}>
                {labelFields.map((fieldKey, index) => {
                    const content = fieldKey === 'customText' 
                        ? customText 
                        : (data?.[fieldKey] || `[${fieldKey}]`);

                    return (
                        <span key={`${fieldKey}-${index}`} className={`max-w-full block ${index === 0 && isFirstLineBold ? 'font-bold' : ''}`} style={{wordBreak: 'break-word'}}>
                            {content || '\u00A0'}
                        </span>
                    );
                })}
            </div>
        </div>
        <div className="mt-auto flex-shrink-0 w-full flex justify-center" style={{ padding: '0 1mm' }}>
            {barcodeFormat === 'CODE128' ? <Barcode text={data?.barcode || '123456789012'} /> : <QRCode text={data?.barcode || '123456789012'} size={`${Math.min(settings.labelWidth * 0.8, settings.labelHeight * 0.6)}mm`} />}
        </div>
    </div>
  );

  const renderLabels = () => {
    const totalSlots = settings.numCols * settings.numRows;
    return Array.from({ length: totalSlots }).map((_, i) => (
        <div key={`label-${i}`} className="border border-dashed border-gray-300 overflow-hidden box-border">
            {labelsToPrint[i] ? renderSingleLabel(labelsToPrint[i], i) : null}
        </div>
    ));
  };
  
  return (
    <>
      <style>{`.no-print { display: block; } #print-area { display: block; } @media print { body * { visibility: hidden; } .no-print { display: none; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100% !important; height: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; } }`}</style>
      <div className="bg-slate-100 min-h-screen text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          <header className="mb-8 no-print flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Kitap Barkod Oluşturucu</h1>
                    <p className="text-slate-600 mt-1">Veri yükleyin, barkod seçin ve etiket şablonunuzu oluşturun.</p>
                </div>
            </header>
          <div className="flex flex-col gap-8">
            <div className="bg-white p-4 rounded-lg shadow-sm no-print">
                <h3 className="font-bold border-b pb-2 mb-3">1. Veri Dosyası Yükle</h3>
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {fileName && <p className="text-sm text-gray-500 mt-2">Yüklendi: {fileName} ({allData.length} kayıt)</p>}
                {errorMessage && <p className="text-sm text-red-500 mt-2">{errorMessage}</p>}
            </div>

            {allData.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm no-print">
                <h3 className="font-bold border-b pb-2 mb-3">2. Materyal Seçimi ({selectedBarcodes.size})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Aralığa Göre Seç</h4>
                        <div className="flex items-center gap-2">
                           <input type="text" placeholder="Başlangıç Barkodu" value={startBarcode} onChange={e => setStartBarcode(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                           <input type="text" placeholder="Bitiş Barkodu" value={endBarcode} onChange={e => setEndBarcode(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                           <button onClick={handleSelectByRange} className="px-4 py-2 border rounded text-sm bg-slate-50 hover:bg-slate-100">Seç</button>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Gruplara Göre Seç</h4>
                        <div className="flex items-center gap-2">
                           <select defaultValue="" onChange={handleLocationSelect} className="w-full p-2 border rounded-md text-sm bg-white" disabled={uniqueLocations.length === 0}><option value="">Bölüme Göre...</option>{uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
                           <select defaultValue="" onChange={handleDeweySelect} className="w-full p-2 border rounded-md text-sm bg-white"><option value="">Yer Numarasına Göre...</option>{Object.entries(deweyCategories).map(([key, value]) => key && <option key={key} value={key}>{value}</option>)}</select>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 my-4">
                  <div className="flex items-center gap-2"><button onClick={handleSelectAllFiltered} className="px-3 py-1 border rounded text-sm bg-slate-50 hover:bg-slate-100">Tümünü Seç</button><button onClick={handleDeselectAllFiltered} className="px-3 py-1 border rounded text-sm bg-red-50 text-red-700 hover:bg-red-100">Tüm Seçimi Kaldır</button></div>
                  <div className="flex items-center gap-2"><button onClick={handleSelectPage} className="px-3 py-1 border rounded text-sm bg-slate-50 hover:bg-slate-100">Sayfayı Seç</button><button onClick={handleDeselectPage} className="px-3 py-1 border rounded text-sm bg-red-50 text-red-700 hover:bg-red-100">Sayfa Seçimini Kaldır</button></div>
                </div>
                <input type="text" placeholder="Veriler içinde ara..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full p-2 border rounded-md text-sm mb-3" />
                <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-slate-50">{['', ...tableHeaders].map((header, idx) => (<th key={idx} className="p-2 cursor-pointer hover:bg-slate-100 select-none" onClick={() => idx > 0 && requestSort(header.key)}>{header.label || ''}{idx > 0 && sortConfig.key === header.key && <span className="ml-1 text-xs">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>}</th>))}</tr></thead><tbody>{paginatedData.map(item => (<tr key={item.barcode} className="border-b hover:bg-slate-50"><td className="p-2"><input type="checkbox" checked={selectedBarcodes.has(item.barcode)} onChange={(e) => updateSelection([item.barcode], e.target.checked)} className=""/></td>{tableHeaders.map(header => (<td key={`${item.barcode}-${header.key}`} className={`p-2 ${header.key === 'barcode' ? 'font-mono' : ''}`}>{item[header.key]}</td>))}</tr>))}</tbody></table></div>
                <div className="flex justify-between items-center mt-3 text-sm"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">Önceki</button><span>{currentPage} / {Math.ceil(sortedData.length / itemsPerPage) || 1}</span><button onClick={() => setCurrentPage(p => Math.min(Math.ceil(sortedData.length / itemsPerPage), p + 1))} disabled={currentPage * itemsPerPage >= sortedData.length} className="px-3 py-1 border rounded disabled:opacity-50">Sonraki</button></div>
            </div>
            )}
            
            <div className="bg-white p-4 rounded-lg shadow-sm no-print">
                <h3 className="font-bold border-b pb-2 mb-3">3. Etiket Ayarları</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="grid md:grid-cols-2 gap-6">
                           <div>
                                <h4 className="font-semibold text-sm mb-2">Etiket İçeriği</h4>
                                <p className="text-xs text-slate-500 mb-2">En fazla 3 öğe seçin.</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                                  {availableFields.map(field => ( <label key={field.key} className="flex items-center space-x-2 text-sm cursor-pointer"><input type="checkbox" value={field.key} checked={labelFields.includes(field.key)} onChange={handleFieldSelection} disabled={!labelFields.includes(field.key) && labelFields.length >= 3} className="disabled:opacity-50"/><span className="truncate">{field.label}</span></label>))}
                                  <div className="col-span-2 mt-2 pt-2 border-t">
                                      <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                          <input type="checkbox" value="customText" checked={labelFields.includes('customText')} onChange={handleFieldSelection} disabled={!labelFields.includes('customText') && labelFields.length >= 3} className="disabled:opacity-50"/>
                                          <span className="font-medium">Özel Metin Ekle</span>
                                      </label>
                                      {labelFields.includes('customText') && (
                                          <input
                                              type="text"
                                              value={customText}
                                              onChange={e => setCustomText(e.target.value)}
                                              placeholder="Etikete eklenecek özel metni girin..."
                                              className="w-full mt-2 p-2 border rounded-md text-sm"
                                          />
                                      )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div><label className="text-xs font-medium block mb-1">Hizalama</label><select value={textAlign} onChange={(e) => setTextAlign(e.target.value)} className="w-full p-2 border rounded-md text-sm"><option value="left">Sola</option><option value="center">Orta</option><option value="right">Sağa</option></select></div>
                                    <div><label className="text-xs font-medium block mb-1">Yazı Boyutu (pt)</label><input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full p-2 border rounded-md text-sm"/></div>
                                    <div><label className="text-xs font-medium block mb-1">Yazı Tipi</label><select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full p-2 border rounded-md text-sm"><option value="sans-serif">Sans-Serif</option><option value="serif">Serif</option><option value="monospace">Monospace</option></select></div>
                                    <div><label className="text-xs font-medium block mb-1">Barkod Tipi</label><select value={barcodeFormat} onChange={(e) => setBarcodeFormat(e.target.value)} className="w-full p-2 border rounded-md text-sm"><option value="CODE128">Barkod (CODE128)</option><option value="QR">QR Kod</option></select></div>
                                </div>
                                <label className="flex items-center space-x-2 text-sm cursor-pointer"><input type="checkbox" checked={isFirstLineBold} onChange={e => setIsFirstLineBold(e.target.checked)} /><span>İlk satır kalın olsun</span></label>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-2">Logo</h4>
                                <div className="flex items-center space-x-2 text-sm mb-2"><input type="checkbox" id="ministryLogoCheck" checked={useMinistryLogo} onChange={handleMinistryLogoToggle} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><label htmlFor="ministryLogoCheck" className="cursor-pointer select-none">Bakanlık Logosunu Kullan</label></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-xs font-medium block mb-1">...veya Özel Logo Yükle</label><input type="file" accept="image/*" onChange={handleLogoChange} className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div>
                                    <div><label className="text-xs font-medium block mb-1">Logo Yüksekliği (mm)</label><input type="number" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="w-full p-2 border rounded-md text-sm"/></div>
                                </div>
                                {logo && <img src={logo} alt="Logo Önizleme" className="mt-2 max-h-12 border p-1 rounded bg-white" />}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Canlı Önizleme</h4>
                        <div className="p-2 bg-slate-200 rounded-md">
                           <div style={{ transform: 'scale(1.5)', transformOrigin: 'top left', minHeight: `${settings.labelHeight * 1.5 + 10}px`}}>
                                <div className="border border-dashed border-gray-400 overflow-hidden box-border bg-white" style={{ width: `${settings.labelWidth}mm`, height: `${settings.labelHeight}mm` }}>
                                   {renderSingleLabel(labelsToPrint[0], 'preview')}
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mt-6 border-t pt-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Sayfa Yerleşimi</h4>
                        <select value={selectedTemplateKey} onChange={(e) => loadTemplate(e.target.value)} className="w-full p-2 border rounded-md text-sm mb-2"><option value="system4">Sistem 4'lü</option><option value="system3">Sistem 3'lü</option><option value="custom">Özel</option>{Object.keys(customTemplates).length > 0 && <option value="load_custom" disabled>--- Kayıtlı Şablonlar ---</option>}{Object.keys(customTemplates).map(name => <option key={name} value={name}>{name}</option>)}</select>
                        {selectedTemplateKey === 'custom' && (<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t pt-2">{Object.keys(settings).filter(k => k !== 'name' && k !== 'unit').map(key => (<label key={key}>{settingLabels[key] || key} ({settings.unit}): <input type="number" value={settings[key]} onChange={e=>handleSettingChange(key, e.target.value)} className="w-full p-1 border rounded"/></label>))}</div>)}
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm mb-2">Özel Şablonlar</h4>
                         <div className="flex items-center gap-2 mb-3">
                            <input type="text" placeholder="Yeni şablon adı..." value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
                            <button onClick={handleSaveTemplate} className="px-4 py-2 border rounded text-sm bg-blue-50 hover:bg-blue-100 text-blue-700">Kaydet</button>
                        </div>
                        <h5 className="text-xs font-medium mb-1">Kayıtlı Şablonlar</h5>
                        <div className="space-y-1">{Object.keys(customTemplates).length > 0 ? Object.keys(customTemplates).map(name => (<div key={name} className="flex justify-between items-center text-sm p-1 rounded hover:bg-slate-100"><span>{name}</span><div><button onClick={() => {setSelectedTemplateKey(name); setSettings(customTemplates[name])}} className="text-xs mr-2 text-blue-600">Yükle</button><button onClick={() => handleDeleteTemplate(name)} className="text-xs text-red-600">Sil</button></div></div>)) : <p className="text-xs text-slate-500">Kayıtlı özel şablon yok.</p>}</div>
                    </div>
                </div>
             </div>

            <div className="w-full flex flex-col gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm no-print">
                     <div className="mb-4"><label className="text-sm font-medium block mb-1">PDF Dosya Adı</label><input type="text" value={pdfFileName} onChange={(e) => setPdfFileName(e.target.value)} className="w-full p-2 border rounded-md text-sm" placeholder="etiketler"/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handlePrintAsPdf} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 shadow disabled:opacity-50" disabled={labelsToPrint.length === 0}>PDF Olarak İndir</button>
                        <button onClick={() => setSelectedBarcodes(new Set())} className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 shadow disabled:opacity-50" disabled={selectedBarcodes.size === 0}>Tüm Seçimleri Temizle</button>
                    </div>
                </div>
                
                <main className="w-full flex justify-center items-start">
                  <div id="print-area" className="bg-white shadow-lg overflow-hidden" style={{ width: `${settings.pageWidth}${settings.unit}`, height: `${settings.pageHeight}${settings.unit}`, boxSizing: 'border-box' }}>
                    <div className="grid p-0 m-0" style={{ width: '100%', height: '100%', paddingTop: `${settings.marginTop}${settings.unit}`, paddingLeft: `${settings.marginLeft}${settings.unit}`, gridTemplateColumns: `repeat(${settings.numCols}, ${settings.labelWidth}${settings.unit})`, gridTemplateRows: `repeat(${settings.numRows}, ${settings.labelHeight}${settings.unit})`, columnGap: `${settings.colGap}${settings.unit}`, rowGap: `${settings.rowGap}${settings.unit}` }}>
                      {renderLabels()}
                    </div>
                  </div>
                </main>

                   <footer className="text-center py-8">
                    <a href="https://ismailkaraca.com.tr/qr.php" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-lg bg-white px-4 py-2 text-xs text-gray-700 shadow-lg transition-shadow hover:shadow-xl">
                        <img src="https://www.ismailkaraca.com.tr/wp-content/uploads/2025/03/ismail1002025.svg" alt="İsmail Karaca Logo" className="h-8 w-8 rounded-full" />
                        <span className="font-medium">Bu uygulama İsmail Karaca tarafından geliştirilmiştir. Görüş ve önerilerinizi iletmek için tıklayınız.</span>
                    </a>
                </footer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

