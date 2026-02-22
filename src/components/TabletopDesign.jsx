// components/TabletopDesign.jsx
import React from "react";
import { Box } from "@mui/material";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

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

// FUNÇÃO PARA DESENHAR BOLINHAS DE REDIMENSIONAMENTO EM TOKENS INDIVIDUAIS
export function desenharBolinhasRedimensionamento(ctx, x, y, largura, altura, zoom) {
    ctx.save();

    const TAMANHO_BOLINHA = Math.max(8, 16 * zoom);
    const DISTANCIA_EXTERNA = Math.max(4, 8 * Math.min(zoom, 1));
    const RAIO = TAMANHO_BOLINHA / 2;

    const posicoes = [
        { x: x + largura + DISTANCIA_EXTERNA, y: y + altura + DISTANCIA_EXTERNA }, // SE
        { x: x - DISTANCIA_EXTERNA, y: y + altura + DISTANCIA_EXTERNA }, // SW
        { x: x + largura + DISTANCIA_EXTERNA, y: y - DISTANCIA_EXTERNA }, // NE
        { x: x - DISTANCIA_EXTERNA, y: y - DISTANCIA_EXTERNA } // NW
    ];

    posicoes.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, RAIO, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    ctx.restore();
}

// Desenha a área de seleção (retângulo de seleção)
export function desenharAreaSelecao(ctx, area) {
    if (!area || !area.ativo) return;

    ctx.save();

    const x1 = area.inicioX;
    const y1 = area.inicioY;
    const x2 = area.fimX;
    const y2 = area.fimY;

    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    const top = Math.min(y1, y2);
    const bottom = Math.max(y1, y2);
    const width = right - left;
    const height = bottom - top;

    // Fundo semi-transparente azul
    ctx.fillStyle = 'rgba(0, 123, 255, 0.15)';
    ctx.fillRect(left, top, width, height);
    
    // Borda azul sólida
    ctx.strokeStyle = 'rgba(0, 123, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, width, height);
    
    // Cantos com pequenos quadrados para indicar que está selecionando
    const tamanhoCanto = 6;
    ctx.fillStyle = 'rgba(0, 123, 255, 0.9)';
    
    // Canto superior esquerdo
    ctx.fillRect(left - 2, top - 2, tamanhoCanto, tamanhoCanto);
    // Canto superior direito
    ctx.fillRect(right - tamanhoCanto + 2, top - 2, tamanhoCanto, tamanhoCanto);
    // Canto inferior esquerdo
    ctx.fillRect(left - 2, bottom - tamanhoCanto + 2, tamanhoCanto, tamanhoCanto);
    // Canto inferior direito
    ctx.fillRect(right - tamanhoCanto + 2, bottom - tamanhoCanto + 2, tamanhoCanto, tamanhoCanto);

    // Texto mostrando a área em pixels
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.round(width)} x ${Math.round(height)}`, left + 5, top - 5);
    
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
export function BarraLateral({ onAbrirModal }) {
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
                        justifyContent: 'center'
                    }}
                >
                    <PersonAddIcon fontSize="small" />
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

// Menu de contexto pra opções do token
export const MenuContextoToken = React.forwardRef(({ 
    x, y, aberto, onFechar, onDeletar, onOcultar, onBloquear, tokenNome, estaOculto, estaBloqueado 
}, ref) => {
    if (!aberto) return null;
    
    const textoOcultar = estaOculto ? "Mostrar (todos veem)" : "Ocultar (só eu vejo)";
    const textoBloquear = estaBloqueado ? "Desbloquear token" : "Bloquear token";
    
    return (
        <div
            ref={ref}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                zIndex: 1000,
                minWidth: '180px'
            }}
        >
            {/* Cabeçalho com o nome do token */}
            <div style={{ 
                padding: '8px 12px', 
                borderBottom: '1px solid #444', 
                color: '#aaa',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{tokenNome}</span>
            </div>
            
            {/* Botão Ocultar/Mostrar */}
            <button
                onClick={() => {
                    onOcultar();
                    onFechar();
                }}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #333',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                {estaOculto ? (
                    <VisibilityOffIcon sx={{ fontSize: 18 }} />
                ) : (
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                )}
                {textoOcultar}
            </button>

            {/* Botão Bloquear/Desbloquear */}
            <button
                onClick={() => {
                    onBloquear();
                    onFechar();
                }}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #333',
                    color: estaBloqueado ? '#4caf50' : '#f9c371ff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a3a3a';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {estaBloqueado ? (
                    <LockOpenIcon sx={{ fontSize: 18, color: '#4caf50' }} />
                ) : (
                    <LockIcon sx={{ fontSize: 18, color: '#ffa726' }} />
                )}
                {textoBloquear}
            </button>
            
            {/* Botão Deletar */}
            <button
                onClick={() => {
                    onDeletar();
                    onFechar();
                }}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#ff6b6b',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a3a3a';
                    e.currentTarget.style.color = '#ff8a8a';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#ff6b6b';
                }}
            >
                <DeleteIcon sx={{ fontSize: 18 }} />
                Deletar token
            </button>
        </div>
    );
});