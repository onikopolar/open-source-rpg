// components/TabletopDesign.jsx
import React from "react";
import { Box } from "@mui/material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BrushIcon from '@mui/icons-material/Brush';
import { calcularPosicoesBolinhas } from "./Tabletop/useSelecaoToken";

// FUNÇÕES DE DESENHO

// Desenha a borda de arrasto
export function desenharBordaDeArrasto(ctx, x, y, largura, altura, nomeUsuario) {
    ctx.save();

    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(x - 6, y - 6, largura + 12, altura + 12);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 3, y - 3, largura + 6, altura + 6);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x + (largura / 2) - 40, y - 30, 80, 20);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nomeUsuario || "Usuario", x + (largura / 2), y - 20);

    ctx.restore();
}

// FUNÇÃO PARA DESENHAR SELEÇÃO (MESMO ESTILO PARA INDIVIDUAL E GRUPO)
export function desenharSelecao(ctx, boundingBox, zoom, quantidadeItens = 1, semFundo = false) {
    if (!boundingBox) return;

    ctx.save();

    const padding = 4;
    const x = boundingBox.x - padding;
    const y = boundingBox.y - padding;
    const width = boundingBox.largura + (padding * 2);
    const height = boundingBox.altura + (padding * 2);

    // Fundo semitransparente azul
    if (!semFundo) {
        ctx.fillStyle = 'rgba(0, 123, 255, 0.15)';
        ctx.fillRect(x, y, width, height);
    }

    // Borda azul sólida
    ctx.strokeStyle = 'rgba(0, 123, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, width, height);

    // Cantos decorativos azuis
    const tamanhoCanto = 8;
    ctx.fillStyle = 'rgba(0, 123, 255, 0.9)';
    ctx.fillRect(x - 2, y - 2, tamanhoCanto, tamanhoCanto);
    ctx.fillRect(x + width - tamanhoCanto + 2, y - 2, tamanhoCanto, tamanhoCanto);
    ctx.fillRect(x - 2, y + height - tamanhoCanto + 2, tamanhoCanto, tamanhoCanto);
    ctx.fillRect(x + width - tamanhoCanto + 2, y + height - tamanhoCanto + 2, tamanhoCanto, tamanhoCanto);

    // Texto informativo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';

    if (quantidadeItens > 1) {
        ctx.fillText(`${quantidadeItens} itens selecionados`, x + width / 2, y - 10);
    } else {
        ctx.fillText(`${Math.round(width)} x ${Math.round(height)}`, x + 5, y - 5);
    }

    // Bolinhas de redimensionamento
    desenharBolinhasRedimensionamento(ctx, boundingBox.x, boundingBox.y, boundingBox.largura, boundingBox.altura, zoom);

    ctx.restore();
}

// FUNÇÃO PARA DESENHAR BOLINHAS DE REDIMENSIONAMENTO
export function desenharBolinhasRedimensionamento(ctx, x, y, largura, altura, zoom) {
    ctx.save();

    console.log(`🎨 [TabletopDesign] desenharBolinhasRedimensionamento - INÍCIO`);
    console.log(`   zoom: ${zoom.toFixed(4)}`);

    const { posicoes, raioBolinha } = calcularPosicoesBolinhas(x, y, largura, altura, zoom);

    console.log(`   raioBolinha: ${raioBolinha.toFixed(2)}`);
    console.log(`   posições calculadas:`);
    posicoes.forEach(p => {
        console.log(`      ${p.nome}: (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`);
    });

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

    console.log(`🎨 [TabletopDesign] desenharBolinhasRedimensionamento - FIM`);
    ctx.restore();
}

// Desenha fallback (quando imagem não carrega)
export function desenharFallbackToken(ctx, x, y, zoomAtual, nomeToken) {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
    ctx.fillRect(x, y, 50 * zoomAtual, 50 * zoomAtual);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nomeToken || "Token", x + (50 * zoomAtual) / 2, y + (50 * zoomAtual) / 2);
}

// COMPONENTES DE UI

// Barra lateral de ferramentas
export function BarraLateral({ onAbrirModal, onAbrirModalNevoa }) {
    return (
        <Box sx={{
            width: '60px',
            backgroundColor: 'rgba(0, 0, 0, 0.27)',
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
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
                        backgroundColor: '#2c3e50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3e5a6f'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2c3e50'}
                >
                    <BrushIcon fontSize="small" />
                </button>
            </Box>
        </Box>
    );
}

// Container principal do grid
export function GridContainer({ children, containerRef, isDragging, onDragOver, onDrop }) {
    return (
        <Box
            ref={containerRef}
            sx={{
                width: '800px',
                height: '600px',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#1a1a1a',
                cursor: isDragging ? 'grabbing' : 'default',
                userSelect: 'none',
                display: 'flex'
            }}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {children}
        </Box>
    );
}

// Canvas pra desenho
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