import { useState, useMemo } from 'react'
import './App.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

function CurrencyInput({ label, value, onChange, id }) {
  const [displayValue, setDisplayValue] = useState(
    value === 0 ? '' : value.toString().replace('.', ',')
  );

  const handleChange = (e) => {
    let val = e.target.value;
    
    // Check if it's negative
    const isNegative = val.startsWith('-');
    
    // Remove all non-digit characters
    let numStr = val.replace(/\D/g, '');
    
    if (numStr === '') {
      setDisplayValue(isNegative ? '-' : '');
      onChange(0);
      return;
    }

    // Convert to number (divided by 100 to get decimals)
    let num = parseInt(numStr, 10) / 100;
    if (isNegative) num = -num;

    // Format for display: e.g. "-1.500,00" or "1.500,00"
    const formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    // Keep the minus sign in the display if it's negative
    let formattedDisplay = formatter.format(Math.abs(num));
    if (isNegative) formattedDisplay = '-' + formattedDisplay;

    setDisplayValue(formattedDisplay);
    onChange(num);
  };

  const isNegative = value < 0;

  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrapper">
        <span className="input-prefix">R$</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          className={`currency-input ${isNegative ? 'negative' : ''}`}
          value={displayValue}
          onChange={handleChange}
          placeholder="0,00"
        />
      </div>
    </div>
  );
}

function App() {
  const [margem1, setMargem1] = useState(0);
  const [margem2, setMargem2] = useState(0);
  const [margem3, setMargem3] = useState(0);

  // Calcula Ofertas
  const calcM1 = useMemo(() => {
    if (margem1 >= 60.00) {
      const parcela = margem1;
      const liberado = parcela * 45.13142857142857;
      const comissao = liberado * 0.0076;
      return { ativa: true, parcela, liberado, comissao, prazo: 120, name: 'Margem A (35%)' };
    }
    return { ativa: false, parcela: 0, liberado: 0, comissao: 0, prazo: 0, name: 'Margem A (35%)' };
  }, [margem1]);

  const calcM2 = useMemo(() => {
    if (margem2 >= 36.00) {
      const parcela = margem2 * 0.85;
      const liberado = parcela * 17.63855421686747;
      const comissao = liberado * 0.08;
      return { ativa: true, parcela, liberado, comissao, prazo: 60, name: 'Margem B (5%)' };
    }
    return { ativa: false, parcela: 0, liberado: 0, comissao: 0, prazo: 0, name: 'Margem B (5%)' };
  }, [margem2]);

  const calcM3 = useMemo(() => {
    if (margem3 >= 36.00) {
      const parcela = margem3 * 0.85;
      const liberado = parcela * 17.63855421686747;
      const comissao = liberado * 0.08;
      return { ativa: true, parcela, liberado, comissao, prazo: 60, name: 'Margem C (5%)' };
    }
    return { ativa: false, parcela: 0, liberado: 0, comissao: 0, prazo: 0, name: 'Margem C (5%)' };
  }, [margem3]);

  const totalLiberado = calcM1.liberado + calcM2.liberado + calcM3.liberado;
  const totalComissao = calcM1.comissao + calcM2.comissao + calcM3.comissao;

  // Lógica de Classificação
  const statusInfo = useMemo(() => {
    const hasM1 = calcM1.ativa;
    const hasCard = calcM2.ativa || calcM3.ativa;

    if (hasM1 && hasCard) {
      return { text: "💎 DIAMANTE - Empréstimo + Cartão", class: "status-diamante" };
    }
    if (margem1 < 0 && hasCard) {
      return { text: "🏆 OURO - Negativado c/ Cartão", class: "status-ouro" };
    }
    if (hasM1 && !hasCard) {
      return { text: "🥈 PRATA - Empréstimo Novo", class: "status-prata" };
    }
    if (!hasM1 && margem1 >= 0 && hasCard) {
      return { text: "🥉 BRONZE - Cartão Complementar", class: "status-bronze" };
    }
    
    return { text: "❌ Descarte", class: "status-descarte" };
  }, [margem1, calcM1, calcM2, calcM3]);

  const handleCopy = async () => {
    let msg = `📊 *Detalhamento de Simulação*\n\n`;
    
    if (calcM1.ativa) {
      msg += `*${calcM1.name}:*\n`;
      msg += `Libera *${formatCurrency(calcM1.liberado)}*\n`;
      msg += `▶️ Parcela: ${formatCurrency(calcM1.parcela)}\n`;
      msg += `▶️ Prazo: ${calcM1.prazo}x\n\n`;
    }
    
    if (calcM2.ativa) {
      msg += `*${calcM2.name}:*\n`;
      msg += `Libera *${formatCurrency(calcM2.liberado)}*\n`;
      msg += `▶️ Parcela: ${formatCurrency(calcM2.parcela)}\n`;
      msg += `▶️ Prazo: ${calcM2.prazo}x\n\n`;
    }
    
    if (calcM3.ativa) {
      msg += `*${calcM3.name}:*\n`;
      msg += `Libera *${formatCurrency(calcM3.liberado)}*\n`;
      msg += `▶️ Parcela: ${formatCurrency(calcM3.parcela)}\n`;
      msg += `▶️ Prazo: ${calcM3.prazo}x\n\n`;
    }
    
    if (totalLiberado > 0) {
      msg += `💰 *Total Liberado: ${formatCurrency(totalLiberado)}*`;
    } else {
      msg += `❌ Nenhuma margem disponível para liberação.`;
    }

    try {
      await navigator.clipboard.writeText(msg);
      alert('Simulação copiada para o WhatsApp!');
    } catch (err) {
      console.error('Falha ao copiar: ', err);
      alert('Erro ao copiar simulação.');
    }
  };

  const renderCard = (title, calcInfo, isNegative) => {
    if (isNegative) {
      return (
        <div className="result-card inactive">
          <div className="card-header">
            <h3 className="card-title">{title}</h3>
            <span className="badge inactive">Negativa</span>
          </div>
          <div className="info-row">
            <span className="info-label">Parcela</span>
            <span className="info-value">-</span>
          </div>
          <div className="info-row">
            <span className="info-label">Prazo</span>
            <span className="info-value">-</span>
          </div>
          <div className="liberado-highlight">
            <span className="info-label">Valor Liberado</span>
            <span className="info-value" style={{color: 'var(--text-secondary)'}}>R$ 0,00</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`result-card ${!calcInfo.ativa ? 'inactive' : ''}`}>
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          <span className={`badge ${calcInfo.ativa ? 'active' : 'inactive'}`}>
            {calcInfo.ativa ? 'Disponível' : 'Insuficiente'}
          </span>
        </div>
        
        <div className="info-row">
          <span className="info-label">Parcela</span>
          <span className="info-value">{formatCurrency(calcInfo.parcela)}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Prazo</span>
          <span className="info-value">{calcInfo.prazo ? `${calcInfo.prazo}x` : '-'}</span>
        </div>
        
        <div className="liberado-highlight">
          <span className="info-label">Valor Liberado</span>
          <span className="info-value" style={!calcInfo.ativa ? {color: 'var(--text-secondary)'} : {}}>
            {formatCurrency(calcInfo.liberado)}
          </span>
        </div>

        {calcInfo.ativa && (
          <div className="comissao-row">
            <span className="info-label">Sua Comissão</span>
            <span className="comissao-value">{formatCurrency(calcInfo.comissao)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="left-column">
        <header className="header">
          <h1>Simulador Núcleo</h1>
          <p>Calculadora de Margem Consignada</p>
        </header>

        <div className="glass-panel">
          <div className="input-grid">
            <CurrencyInput id="m1" label="Margem 1 (Novo)" value={margem1} onChange={setMargem1} />
            <CurrencyInput id="m2" label="Margem 2 (Cartão)" value={margem2} onChange={setMargem2} />
            <CurrencyInput id="m3" label="Margem 3 (Cartão)" value={margem3} onChange={setMargem3} />
          </div>
        </div>
      </div>

      <div className="right-column">
        <div className="results-grid">
          {renderCard("Margem 1", calcM1, margem1 < 0)}
          {renderCard("Margem 2", calcM2, margem2 < 0)}
          {renderCard("Margem 3", calcM3, margem3 < 0)}
        </div>

        <div className="summary-panel">
          <div className={`status-badge ${statusInfo.class}`}>
            {statusInfo.text}
          </div>
          
          <div className="totals-container">
            <div className="total-box">
              <div className="total-label">Total Liberado</div>
              <div className="total-value">{formatCurrency(totalLiberado)}</div>
            </div>
            
            <div className="total-box highlight-box">
              <div className="total-label" style={{color: '#fbbf24'}}>Comissão Prevista</div>
              <div className="total-value comissao-total">{formatCurrency(totalComissao)}</div>
            </div>
          </div>
          
          <button className="copy-btn" onClick={handleCopy} disabled={totalLiberado === 0 && statusInfo.text === "❌ Descarte"}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar para WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
