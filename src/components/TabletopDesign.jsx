// src/components/TabletopDesign.jsx
import React from "react";
import { Box } from "@mui/material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BrushIcon from '@mui/icons-material/Brush';
import { calcularPosicoesBolinhas } from "./Tabletop/useSelecaoToken";

// Cores fixas para cada sheetId
const coresPorSheet = {};

export function getCorSheet(sheetId) {
    if (!sheetId) return 'rgba(255, 215, 0, 0.8)';
    if (coresPorSheet[sheetId]) return coresPorSheet[sheetId];
    const hash = String(sheetId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash * 137) % 360;
    const cor = `hsl(${hue}, 70%, 55%)`;
    coresPorSheet[sheetId] = cor;
    return cor;
}

export function desenharBordaDeArrasto(ctx, x, y, largura, altura, nomeUsuario, cor = 'rgba(255, 215, 0, 0.8)') {
    ctx.save();
    ctx.strokeStyle = cor;
    ctx.lineWidth = 6;
    ctx.shadowColor = cor;
    ctx.shadowBlur = 10;
    ctx.strokeRect(x - 6, y - 6, largura + 12, altura + 12);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x + (largura / 2) - 40, y - 30, 80, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nomeUsuario || "Usuario", x + (largura / 2), y - 20);
    ctx.restore();
}

export function desenharFallbackToken(ctx, x, y, zoomAtual, nomeToken) {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
    ctx.fillRect(x, y, 50 * zoomAtual, 50 * zoomAtual);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nomeToken || "Token", x + (50 * zoomAtual) / 2, y + (50 * zoomAtual) / 2);
}

export function desenharSelecao(ctx, boundingBox, zoom, quantidadeItens = 1, semFundo = false, escala = null, rotacao = 0) {
    if (!boundingBox) return;
    ctx.save();
    const padding = 4;
    const x = boundingBox.x - padding;
    const y = boundingBox.y - padding;
    const width = boundingBox.largura + (padding * 2);
    const height = boundingBox.altura + (padding * 2);
    const cx = boundingBox.x + boundingBox.largura / 2;
    const cy = boundingBox.y + boundingBox.altura / 2;

    if (rotacao && rotacao !== 0) {
        ctx.translate(cx, cy);
        ctx.rotate((rotacao * Math.PI) / 180);
        ctx.translate(-cx, -cy);
    }
    if (!semFundo) {
        ctx.fillStyle = 'rgba(0, 123, 255, 0.15)';
        ctx.fillRect(x, y, width, height);
    }
    ctx.strokeStyle = 'rgba(0, 123, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, width, height);
    const tamanhoCanto = 8;
    ctx.fillStyle = 'rgba(0, 123, 255, 0.9)';
    ctx.fillRect(x - 2, y - 2, tamanhoCanto, tamanhoCanto);
    ctx.fillRect(x + width - tamanhoCanto + 2, y - 2, tamanhoCanto, tamanhoCanto);
    ctx.fillRect(x - 2, y + height - tamanhoCanto + 2, tamanhoCanto, tamanhoCanto);
    ctx.fillRect(x + width - tamanhoCanto + 2, y + height - tamanhoCanto + 2, tamanhoCanto, tamanhoCanto);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    if (quantidadeItens > 1) {
        ctx.fillText(`${quantidadeItens} itens selecionados`, x + width / 2, y - 10);
    } else if (escala !== null && escala !== undefined) {
        ctx.fillText(`${escala.toFixed(2)}×`, x + width / 2, y - 10);
    } else {
        ctx.fillText(`${Math.round(width)} x ${Math.round(height)}`, x + width / 2, y - 10);
    }
    ctx.restore();
    // Bolinhas desenhadas fora do ctx.rotate() — usam rotação via calcularPosicoesBolinhas
    desenharBolinhasRedimensionamento(ctx, boundingBox.x, boundingBox.y, boundingBox.largura, boundingBox.altura, zoom, rotacao);
}

export function desenharBolinhasRedimensionamento(ctx, x, y, largura, altura, zoom, rotacao = 0) {
    ctx.save();
    const { posicoes, raioBolinha } = calcularPosicoesBolinhas(x, y, largura, altura, zoom, rotacao);
    posicoes.forEach((pos) => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, raioBolinha, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
        ctx.lineWidth = 2;
        const tamanhoMais = raioBolinha * 0.5;
        ctx.moveTo(pos.x - tamanhoMais, pos.y);
        ctx.lineTo(pos.x + tamanhoMais, pos.y);
        ctx.moveTo(pos.x, pos.y - tamanhoMais);
        ctx.lineTo(pos.x, pos.y + tamanhoMais);
        ctx.stroke();
    });
    ctx.restore();
}

// Barra lateral com indicador visual do modo pincel
export function BarraLateral({ onAbrirModal, onAbrirModalNevoa, modoDesenhoAtivo = false }) {
    return (
        <Box sx={{
            width: '60px',
            backgroundColor: 'rgba(0, 0, 0, 0.27)',
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            position: 'relative',
            zIndex: 10
        }}>
            <Box sx={{
                marginTop: 'auto',
                marginBottom: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <button
                    onClick={onAbrirModal}
                    style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#3F51b5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6ec9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3F51b5'}
                >
                    <PersonAddIcon fontSize="small" />
                </button>

                <button
                    onClick={onAbrirModalNevoa}
                    style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#2c3e50', // sempre a mesma cor
                        color: 'white',
                        border: modoDesenhoAtivo ? '2px solid #3ab0ff' : 'none', // apenas borda
                        borderRadius: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: modoDesenhoAtivo ? '0 0 0 2px #134e76' : 'none' // sombra suave apenas na borda
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3e5a6f'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c3e50'}
                    title={modoDesenhoAtivo ? "Modo Pincel Ativo – Clique para abrir o menu" : "Abrir menu de névoa"}
                >
                    <BrushIcon fontSize="small" />
                </button>
            </Box>
        </Box>
    );
}

export function GridContainer({ children, containerRef, isDragging, onDragOver, onDrop, sx = {} }) {
    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#1a1a1a',
                cursor: isDragging ? 'grabbing' : 'default',
                userSelect: 'none',
                display: 'flex',
                ...sx
            }}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {children}
        </Box>
    );
}

export function CanvasDesenho({ canvasRef }) {
    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 5
            }}
        />
    );
}