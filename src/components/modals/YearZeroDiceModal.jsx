import React, { useState } from 'react';
import { withStyles } from '@mui/styles';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import CasinoIcon from '@mui/icons-material/Casino';
import ReplayIcon from '@mui/icons-material/Replay';
import WarningIcon from '@mui/icons-material/Warning';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { api } from '../../utils';

const PANIC_TABLE = [
    { range: "1–6", label: "SEGURANDO A ONDA",  effect: "Você consegue manter seus nervos sob controle. Muito mal." },
    { range: "7",   label: "TIQUE NERVOSO",      effect: "Seu NÍVEL DE ESTRESSE, e o de todos os PJs amigáveis em distância CURTA de você, aumentam em 1." },
    { range: "8",   label: "TREMEDEIRA",         effect: "Todas as rolagens de habilidade usando AGILIDADE sofrem −2 até que seu pânico pare." },
    { range: "9",   label: "SOLTAR ITEM",        effect: "Você solta uma arma ou outro item importante — a MJ decide qual. Seu NÍVEL DE ESTRESSE aumenta em 1." },
    { range: "10",  label: "CONGELAR",           effect: "Paralisado pelo medo por uma Rodada, perdendo sua próxima ação. Seu estresse e o de aliados próximos aumentam em 1." },
    { range: "11",  label: "BUSCAR COBERTURA",   effect: "Use sua próxima ação para se afastar do perigo. Seu estresse diminui em 1, mas o de aliados próximos aumenta em 1." },
    { range: "12",  label: "GRITO",              effect: "Você grita por uma Rodada. Seu estresse diminui em 1, mas aliados que ouvem devem fazer uma Rolagem de Pânico." },
    { range: "13",  label: "FUGA",               effect: "Fuja para um lugar seguro. Não ataca nem arrisca. Seu estresse diminui em 1, mas aliados que te veem devem rolar pânico." },
    { range: "14",  label: "FRENESI",            effect: "Ataque a pessoa/criatura mais próxima — amigável ou não — até que um de vocês esteja Quebrado." },
    { range: "15+", label: "CATATÔNICO",         effect: "Você cai no chão, imóvel e mudo, olhando fixamente para o nada." },
];

const panicSeverity = (total) => {
    if (total <= 6)  return { color: '#22c55e', bg: '#0f1f0f', label: 'ESTÁVEL' };
    if (total <= 8)  return { color: '#facc15', bg: '#1f1a00', label: 'MODERADO' };
    if (total <= 11) return { color: '#f97316', bg: '#1f1000', label: 'GRAVE' };
    if (total <= 13) return { color: '#ef4444', bg: '#1f0a0a', label: 'CRÍTICO' };
    return             { color: '#ef4444', bg: '#1a0505', label: 'CATASTRÓFICO' };
};

const DOT_POSITIONS = {
    1: [[50, 50]],
    2: [[30, 30], [70, 70]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
};

const styles = () => ({
    dialogPaper: {
        background: '#1e1e1e',
        border: '0.5px solid #2e2e2e',
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        fontFamily: "'Rajdhani', sans-serif",
        color: '#e0e0e0',
        overflow: 'hidden',
    },
    dialogPaperPanic: {
        background: '#1e1e1e',
        border: '1px solid #7f1f1f',
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(239,68,68,0.15)',
        fontFamily: "'Rajdhani', sans-serif",
        color: '#e0e0e0',
        overflow: 'hidden',
    },
    header: {
        padding: '16px 20px',
        borderBottom: '0.5px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#171717',
    },
    headerPanic: {
        padding: '16px 20px',
        borderBottom: '0.5px solid #7f1f1f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#1a0a0a',
        position: 'relative',
    },
    headerSubtitle: {
        fontSize: 10,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1,
    },
    headerIconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2a2a2a',
        border: '0.5px solid #444',
    },
    headerIconBoxPanic: {
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2a0a0a',
        border: '1px solid #ef4444',
    },
    content: {
        padding: '20px',
    },
    // --- Input screen ---
    inputGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 16,
    },
    inputField: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    inputLabel: {
        fontSize: 10,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
    },
    inputControl: {
        display: 'flex',
        alignItems: 'center',
        background: '#171717',
        borderRadius: 8,
        overflow: 'hidden',
    },
    inputBtn: {
        border: 'none',
        background: 'transparent',
        fontSize: 18,
        padding: '4px 12px',
        cursor: 'pointer',
        lineHeight: 1,
    },
    inputValue: {
        minWidth: 28,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 700,
        color: '#f1f5f9',
    },
    totalsBar: {
        background: '#171717',
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        gap: 16,
        border: '0.5px solid #2a2a2a',
        alignItems: 'center',
    },
    totalsLabel: {
        fontSize: 11,
        color: '#555',
    },
    totalsValue: {
        fontSize: 18,
        fontWeight: 700,
    },
    // --- Result screen ---
    successBlock: {
        textAlign: 'center',
        padding: '20px 0 16px',
        borderBottom: '0.5px solid #2a2a2a',
        marginBottom: 16,
    },
    successLabel: {
        fontSize: 11,
        color: '#555',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    successNumber: {
        fontSize: 64,
        fontWeight: 900,
        lineHeight: 1,
        fontFamily: "'Share Tech Mono', monospace",
    },
    successText: {
        fontSize: 12,
        marginTop: 4,
    },
    diceGroupLabel: {
        fontSize: 10,
        color: '#555',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    diceGrid: {
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    pushWarning: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#1f1a00',
        border: '0.5px solid #854f0b',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#facc15',
        marginTop: 4,
    },
    // --- Panic screen ---
    panicCalcPanel: {
        background: '#1a0a0a',
        border: '0.5px solid #7f1f1f',
        borderRadius: 12,
        padding: 16,
        marginTop: 4,
    },
    panicCalcHeader: {
        fontSize: 10,
        color: '#ef4444',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    panicCalcRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 16,
    },
    panicCalcItem: {
        textAlign: 'center',
    },
    panicCalcItemLabel: {
        fontSize: 11,
        color: '#555',
        marginBottom: 3,
    },
    panicCalcItemValue: {
        fontSize: 32,
        fontWeight: 900,
        fontFamily: "'Share Tech Mono', monospace",
    },
    panicCalcSep: {
        fontSize: 20,
        color: '#333',
        marginTop: 14,
    },
    revealButton: {
        width: '100%',
        padding: '10px 0',
        borderRadius: 8,
        background: 'transparent',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.08em',
        cursor: 'pointer',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background 0.2s',
    },
    effectBox: {
        borderLeft: '3px solid',
        borderRadius: 0,
        padding: '12px 14px',
    },
    effectLabel: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    effectText: {
        fontSize: 13,
        lineHeight: 1.55,
    },
    effectFooter: {
        fontSize: 11,
        color: '#555',
        marginTop: 8,
        fontStyle: 'italic',
    },
    // --- Footer ---
    footer: {
        padding: '12px 20px',
        borderTop: '0.5px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#171717',
    },
    footerPanic: {
        padding: '12px 20px',
        borderTop: '0.5px solid #2a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#171717',
    },
    btnClose: {
        background: 'transparent',
        border: '0.5px solid #444',
        color: '#aaa',
        borderRadius: 8,
        padding: '7px 16px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
    },
    btnSecondary: {
        background: 'transparent',
        border: '0.5px solid #444',
        color: '#aaa',
        borderRadius: 8,
        padding: '7px 16px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
    },
    btnPush: {
        background: '#1f1a00',
        border: '0.5px solid #854f0b',
        color: '#facc15',
        borderRadius: 8,
        padding: '7px 16px',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    btnRoll: {
        background: '#2a2a2a',
        border: '1px solid #ff6b35',
        color: '#ff6b35',
        borderRadius: 8,
        padding: '7px 20px',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
    },
    '@keyframes diePop': {
        '0%':   { transform: 'scale(1)' },
        '50%':  { transform: 'scale(1.12)' },
        '100%': { transform: 'scale(1)' },
    },
    '@keyframes dieShake': {
        '0%,100%': { transform: 'translateX(0) rotate(0)' },
        '25%':     { transform: 'translateX(-3px) rotate(-4deg)' },
        '75%':     { transform: 'translateX(3px) rotate(4deg)' },
    },
    '@keyframes fadeUp': {
        from: { opacity: 0, transform: 'translateY(6px)' },
        to:   { opacity: 1, transform: 'translateY(0)' },
    },
});

// ─── Die face SVG ──────────────────────────────────────────────────────────────
function DieFace({ value, type, animate = false }) {
    const isSuccess = value === 6;
    const isPanic   = type === 'yellow' && value === 1;
    const dots      = DOT_POSITIONS[Math.min(Math.max(value, 1), 6)] || DOT_POSITIONS[1];
    const r         = 52 * 0.14;

    let fill, stroke, dotColor;
    if (type === 'yellow') {
        if (isPanic) {
            fill = '#3a0a0a'; stroke = '#ef4444'; dotColor = '#ef4444';
        } else if (isSuccess) {
            fill = '#1f1a00'; stroke = '#facc15'; dotColor = '#facc15';
        } else {
            fill = '#1f1800'; stroke = '#facc15'; dotColor = '#facc15';
        }
    } else {
        if (isSuccess) {
            fill = '#0f1f0f'; stroke = '#22c55e'; dotColor = '#22c55e';
        } else {
            fill = '#2a2a2a'; stroke = '#555'; dotColor = '#888';
        }
    }

    const shakeStyle = isPanic && animate
        ? { display: 'inline-block', animation: 'dieShake 0.4s infinite' }
        : isSuccess && animate
            ? { display: 'inline-block', animation: 'diePop 0.5s ease' }
            : { display: 'inline-block' };

    return (
        <div style={shakeStyle}>
            <svg width={52} height={52} viewBox="0 0 100 100">
                <rect x="4" y="4" width="92" height="92" rx="16" fill={fill} stroke={stroke} strokeWidth="2.5" />
                {dots.map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r={r} fill={dotColor} />
                ))}
            </svg>
        </div>
    );
}

// ─── Stepper input ─────────────────────────────────────────────────────────────
function DiceInput({ classes, label, value, onChange, accentColor, hint }) {
    return (
        <div className={classes.inputField}>
            <label className={classes.inputLabel}>{label}</label>
            <div className={classes.inputControl} style={{ border: `0.5px solid ${accentColor}44` }}>
                <button className={classes.inputBtn} style={{ color: accentColor }}
                    onClick={() => onChange(Math.max(0, value - 1))}>−</button>
                <span className={classes.inputValue}>{value}</span>
                <button className={classes.inputBtn} style={{ color: accentColor }}
                    onClick={() => onChange(value + 1)}>+</button>
            </div>
            {hint && <span style={{ fontSize: 10, color: '#555' }}>{hint}</span>}
        </div>
    );
}

// ─── Panic panel ───────────────────────────────────────────────────────────────
function PanicPanel({ classes, panicRollResult, showEffect, onReveal }) {
    if (!panicRollResult) return null;
    const sev = panicSeverity(panicRollResult.totalPanicRoll);

    return (
        <div className={classes.panicCalcPanel}>
            <div className={classes.panicCalcHeader}>
                <WarningIcon style={{ fontSize: 14 }} />
                Rolagem de pânico — {sev.label}
            </div>

            <div className={classes.panicCalcRow}>
                <div className={classes.panicCalcItem}>
                    <div className={classes.panicCalcItemLabel}>1D6</div>
                    <div className={classes.panicCalcItemValue} style={{ color: '#f1f5f9' }}>{panicRollResult.panicRoll}</div>
                </div>
                <div className={classes.panicCalcSep}>+</div>
                <div className={classes.panicCalcItem}>
                    <div className={classes.panicCalcItemLabel}>Estresse</div>
                    <div className={classes.panicCalcItemValue} style={{ color: '#f97316' }}>{panicRollResult.stressLevel}</div>
                </div>
                <div className={classes.panicCalcSep}>=</div>
                <div className={classes.panicCalcItem}>
                    <div className={classes.panicCalcItemLabel}>Total</div>
                    <div className={classes.panicCalcItemValue} style={{ color: sev.color }}>{panicRollResult.totalPanicRoll}</div>
                </div>
            </div>

            {!showEffect ? (
                <button
                    className={classes.revealButton}
                    style={{ border: `1px solid ${sev.color}`, color: sev.color }}
                    onMouseEnter={e => e.currentTarget.style.background = `${sev.color}18`}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={onReveal}
                >
                    <PsychologyIcon style={{ fontSize: 16 }} />
                    Revelar Efeito
                </button>
            ) : (
                <div className={classes.effectBox}
                    style={{ borderLeftColor: sev.color, background: `${sev.bg}` }}>
                    <div className={classes.effectLabel} style={{ color: sev.color }}>
                        {panicRollResult.effect.range} — {panicRollResult.effect.label}
                    </div>
                    <div className={classes.effectText} style={{ color: '#ffffff' }}>
                        {panicRollResult.effect.effect}
                    </div>
                    <div className={classes.effectText} style={{ color: '#bd8e8e' }} >Leia este resultado para o Mestre</div>
                </div>
            )}
        </div>
    );
}

// ─── Main component ────────────────────────────────────────────────────────────
function YearZeroDiceModalRaw({
    classes,
    handleClose,
    characterId,
    baseDice = 0,
    skillDice = 0,
    gearDice = 0,
    attributeName = '',
    skillName = '',
    stressSquares = [],
    onDiceRoll,
    onPushRoll,
}) {
    const stressLevel = stressSquares ? stressSquares.filter(Boolean).length : 0;

    const [attr,   setAttr]   = useState(baseDice);
    const [skill,  setSkill]  = useState(skillDice);
    const [gear,   setGear]   = useState(gearDice);
    const [stress, setStress] = useState(stressLevel);

    const [result,      setResult]      = useState(null);
    const [pushState,   setPushState]   = useState('initial');
    const [panicResult, setPanicResult] = useState(null);
    const [showEffect,  setShowEffect]  = useState(false);
    const [rolling,     setRolling]     = useState(false);
    const [animate,     setAnimate]     = useState(false);

    const roll1 = () => Math.floor(Math.random() * 6) + 1;

    const rollPanic = (lvl) => {
        const d = roll1();
        const total = d + lvl;
        let effect;
        if      (total <= 6)  effect = PANIC_TABLE[0];
        else if (total <= 7)  effect = PANIC_TABLE[1];
        else if (total <= 8)  effect = PANIC_TABLE[2];
        else if (total <= 9)  effect = PANIC_TABLE[3];
        else if (total <= 10) effect = PANIC_TABLE[4];
        else if (total <= 11) effect = PANIC_TABLE[5];
        else if (total <= 12) effect = PANIC_TABLE[6];
        else if (total <= 13) effect = PANIC_TABLE[7];
        else if (total <= 14) effect = PANIC_TABLE[8];
        else                  effect = PANIC_TABLE[9];
        setPanicResult({ panicRoll: d, stressLevel: lvl, totalPanicRoll: total, effect });
        setShowEffect(false);
    };

    const buildResult = (white, yellow, pushed = false) => {
        const wS = white.filter(v => v === 6).length;
        const yS = yellow.filter(v => v === 6).length;
        const panics = yellow.filter(v => v === 1).length;
        return {
            whiteResults: white, yellowResults: yellow,
            whiteDiceCount: white.length, yellowDiceCount: yellow.length,
            whiteSuccesses: wS, yellowSuccesses: yS,
            successes: wS + yS,
            panics, hasPanic: panics > 0,
            pushState: pushed ? 'pushed' : 'initial',
        };
    };

    const triggerAnimate = () => {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 700);
    };

    const doRoll = () => {
        const total = attr + skill + gear + stress;
        if (total < 1) return alert('É necessário pelo menos 1 dado para rolar');
        setRolling(true);
        setTimeout(() => {
            const white  = Array.from({ length: attr + skill + gear }, roll1);
            const yellow = Array.from({ length: stress }, roll1);
            const r = buildResult(white, yellow);
            setResult(r);
            setPushState('initial');
            triggerAnimate();
            if (r.hasPanic) rollPanic(stress);
            if (onDiceRoll) onDiceRoll(r);
            api.post('roll', { character_id: characterId, max_number: 6, times: total }).catch(() => {});
            setRolling(false);
        }, 300);
    };

    const doPush = () => {
        if (onPushRoll) onPushRoll();
        const newWhite  = result.whiteResults.map(d  => (d === 6 || d === 1) ? d : roll1());
        const newYellow = result.yellowResults.map(d => (d === 6 || d === 1) ? d : roll1());
        const r = buildResult(newWhite, newYellow, true);
        setResult(r);
        setPushState('pushed');
        triggerAnimate();
        if (r.hasPanic) rollPanic(stress);
    };

    const resetAll = () => {
        setResult(null);
        setPanicResult(null);
        setShowEffect(false);
        setPushState('initial');
    };

    const isPanic      = result?.hasPanic;
    const canPush      = pushState === 'initial' && result && !isPanic && result.successes === 0;
    const title        = skillName && attributeName ? `${skillName} · ${attributeName}` : skillName || attributeName || 'Year Zero Engine';
    const totalWhite   = attr + skill + gear;

    return (
        <Dialog
            open
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            classes={{ paper: isPanic ? classes.dialogPaperPanic : classes.dialogPaper }}
        >
            {/* ── Header ── */}
            {isPanic ? (
                <div className={classes.headerPanic}>
                    <div>
                        <div className={classes.headerSubtitle} style={{ color: '#ef4444' }}>
                            Year Zero Engine — Pânico
                        </div>
                        <div className={classes.headerTitle} style={{ color: '#fca5a5' }}>{title}</div>
                    </div>
                    <div className={classes.headerIconBoxPanic}>
                        <WarningIcon style={{ color: '#ef4444', fontSize: 18 }} />
                    </div>
                </div>
            ) : (
                <div className={classes.header}>
                    <div>
                        <div className={classes.headerSubtitle} style={{ color: '#9f9f9f' }}>Year Zero Engine</div>
                        <div className={classes.headerTitle} style={{ color: '#f1f5f9' }}>{title}</div>
                    </div>
                    <div className={classes.headerIconBox}>
                        <CasinoIcon style={{ color: '#ff6b35', fontSize: 18 }} />
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            <DialogContent className={classes.content} style={{ padding: 20 }}>
                {!result ? (
                    /* Input screen */
                    <>
                        <div className={classes.inputGrid}>
                            <DiceInput classes={classes} label="Atributo"     value={attr}   onChange={setAttr}   accentColor="#ff6b35" />
                            <DiceInput classes={classes} label="Habilidade"   value={skill}  onChange={setSkill}  accentColor="#60a5fa" />
                            <DiceInput classes={classes} label="Equipamento"  value={gear}   onChange={setGear}   accentColor="#888" />
                            <DiceInput classes={classes} label="Estresse"     value={stress} onChange={setStress} accentColor="#facc15"
                                hint={stressLevel > 0 ? `Quadrados ativos: ${stressLevel}` : undefined} />
                        </div>
                        <div className={classes.totalsBar}>
                            <span className={classes.totalsLabel}>Brancos</span>
                            <span className={classes.totalsValue} style={{ color: '#ddd' }}>{totalWhite}</span>
                            <span style={{ color: '#2a2a2a', margin: '0 4px' }}>│</span>
                            <span className={classes.totalsLabel}>Amarelos</span>
                            <span className={classes.totalsValue} style={{ color: '#facc15' }}>{stress}</span>
                            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={classes.totalsLabel}>Total</span>
                                <span className={classes.totalsValue} style={{ color: '#f1f5f9' }}>{totalWhite + stress}</span>
                            </span>
                        </div>
                    </>
                ) : (
                    /* Result screen */
                    <>
                        {/* Success block — always shown */}
                        <div className={classes.successBlock}>
                            <div className={classes.successLabel}>Sucessos</div>
                            <div className={classes.successNumber}
                                style={{ color: result.successes > 0 ? '#22c55e' : '#ef4444' }}>
                                {result.successes}
                            </div>
                            <div className={classes.successText}
                                style={{ color: result.successes > 0 ? '#22c55e' : '#ef4444' }}>
                                {result.successes > 0 ? 'Ação bem-sucedida!' : 'Ação falhou'}
                            </div>
                        </div>

                        {/* White dice group */}
                        {result.whiteDiceCount > 0 && (
                            <>
                                <div className={classes.diceGroupLabel}>
                                    Dados brancos · {result.whiteSuccesses} sucesso{result.whiteSuccesses !== 1 ? 's' : ''}
                                </div>
                                <div className={classes.diceGrid}
                                    style={{ animation: animate ? 'fadeUp 0.3s ease' : 'none' }}>
                                    {result.whiteResults.map((v, i) => (
                                        <DieFace key={`w${i}`} value={v} type="white" animate={animate} />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Yellow dice group */}
                        {result.yellowDiceCount > 0 && (
                            <>
                                <div className={classes.diceGroupLabel}>
                                    Dados de estresse · {result.yellowSuccesses} sucesso{result.yellowSuccesses !== 1 ? 's' : ''}
                                    {result.panics > 0 && (
                                        <span style={{ color: '#ef4444', marginLeft: 8 }}>
                                            · {result.panics} pânico{result.panics !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className={classes.diceGrid}
                                    style={{ animation: animate ? 'fadeUp 0.3s ease' : 'none' }}>
                                    {result.yellowResults.map((v, i) => (
                                        <DieFace key={`y${i}`} value={v} type="yellow" animate={animate} />
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Push warning */}
                        {canPush && (
                            <div className={classes.pushWarning}>
                                <WarningIcon style={{ fontSize: 14 }} />
                                Empurre para rerolar dados que não sejam 1 ou 6.
                            </div>
                        )}

                        {/* Panic panel */}
                        {isPanic && (
                            <PanicPanel
                                classes={classes}
                                panicRollResult={panicResult}
                                showEffect={showEffect}
                                onReveal={() => setShowEffect(true)}
                            />
                        )}
                    </>
                )}
            </DialogContent>

            {/* ── Footer ── */}
            <div className={isPanic ? classes.footerPanic : classes.footer}>
                <button className={classes.btnClose} onClick={handleClose}>Fechar</button>
                <div style={{ display: 'flex', gap: 8 }}>
                    {result && (
                        <button className={classes.btnSecondary} onClick={resetAll}>Nova Rolagem</button>
                    )}
                    {canPush && (
                        <button className={classes.btnPush} onClick={doPush}>
                            <ReplayIcon style={{ fontSize: 14 }} />
                            Empurrar (+1 Estresse)
                        </button>
                    )}
                    {!result && (
                        <button className={classes.btnRoll} onClick={doRoll} disabled={rolling}>
                            <CasinoIcon style={{ fontSize: 16 }} />
                            {rolling ? 'Rolando…' : 'Rolar'}
                        </button>
                    )}
                </div>
            </div>
        </Dialog>
    );
}

export default withStyles(styles)(YearZeroDiceModalRaw);