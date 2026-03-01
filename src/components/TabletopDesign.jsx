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

// FUNÇÃO ÚNICA PARA DESENHAR SELEÇÃO (SUBSTITUI desenharAreaSelecao E desenharBordaGrupoSelecionado)
export function desenharSelecao(ctx, tokensSelecionados, zoom, tipoSelecao = 'individual', semFundo = false) {
    if (!tokensSelecionados || tokensSelecionados.length === 0) return;

    ctx.save();

    let minX, minY, maxX, maxY;
    let boundingBox = { x: 0, y: 0, largura: 0, altura: 0 };

    if (tipoSelecao === 'grupo' && tokensSelecionados.length > 1) {
        minX = Infinity;
        minY = Infinity;
        maxX = -Infinity;
        maxY = -Infinity;

        tokensSelecionados.forEach(token => {
            minX = Math.min(minX, token.posicaoTela.x);
            minY = Math.min(minY, token.posicaoTela.y);
            maxX = Math.max(maxX, token.posicaoTela.x + token.tamanhoTela.larguraTela);
            maxY = Math.max(maxY, token.posicaoTela.y + token.tamanhoTela.alturaTela);
        });

        boundingBox = {
            x: minX,
            y: minY,
            largura: maxX - minX,
            altura: maxY - minY
        };
    } else {
        const token = tokensSelecionados[0];
        minX = token.posicaoTela.x;
        minY = token.posicaoTela.y;
        maxX = token.posicaoTela.x + token.tamanhoTela.larguraTela;
        maxY = token.posicaoTela.y + token.tamanhoTela.alturaTela;

        boundingBox = {
            x: minX,
            y: minY,
            largura: maxX - minX,
            altura: maxY - minY
        };
    }

    const padding = (tipoSelecao === 'grupo' && tokensSelecionados.length > 1) ? 8 : 4;
    const x = minX - padding;
    const y = minY - padding;
    const width = (maxX - minX) + (padding * 2);
    const height = (maxY - minY) + (padding * 2);

    // Só desenha o fundo se não for semFundo
    if (!semFundo) {
        ctx.fillStyle = 'rgba(0, 123, 255, 0.15)';
        ctx.fillRect(x, y, width, height);
    }

    ctx.strokeStyle = 'rgba(0, 123, 255, 0.9)';
    ctx.lineWidth = (tipoSelecao === 'grupo' && tokensSelecionados.length > 1) ? 2 : 3;

    if (tipoSelecao === 'grupo' && tokensSelecionados.length > 1) {
        ctx.setLineDash([5, 3]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    // Desenha os cantos para TODOS os tipos de seleção (individual OU grupo)
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

    if (tokensSelecionados.length > 1) {
        ctx.fillText(`${tokensSelecionados.length} tokens selecionados`, x + width / 2, y - 10);
    } else {
        ctx.fillText(`${Math.round(width)} x ${Math.round(height)}`, x + 5, y - 5);
    }

    // Desenha as bolinhas de redimensionamento para TODOS os tipos de seleção
    // Verifica se o token não está bloqueado (para grupo, verifica se nenhum está bloqueado)
    let podeRedimensionar = true;
    if (tipoSelecao === 'grupo' && tokensSelecionados.length > 1) {
        // Para grupo, verifica se ALGUM token está bloqueado
        podeRedimensionar = !tokensSelecionados.some(token => token.bloqueado === true);
    } else {
        // Para individual, verifica o primeiro token
        const primeiroToken = tokensSelecionados[0];
        podeRedimensionar = primeiroToken && primeiroToken.bloqueado !== undefined ? !primeiroToken.bloqueado : true;
    }

    if (podeRedimensionar) {
        desenharBolinhasRedimensionamento(ctx, boundingBox.x, boundingBox.y, boundingBox.largura, boundingBox.altura, zoom);
    }

    ctx.restore();
}

// FUNÇÃO PARA DESENHAR BOLINHAS DE REDIMENSIONAMENTO EM TOKENS INDIVIDUAIS
export function desenharBolinhasRedimensionamento(ctx, x, y, largura, altura, zoom) {
    ctx.save();

    const TAMANHO_BOLINHA = Math.max(8, 16 * zoom);
    const DISTANCIA_EXTERNA = Math.max(4, 8 * Math.min(zoom, 1));
    const RAIO = TAMANHO_BOLINHA / 2;

    const posicoes = [
        { x: x + largura + DISTANCIA_EXTERNA, y: y + altura + DISTANCIA_EXTERNA },
        { x: x - DISTANCIA_EXTERNA, y: y + altura + DISTANCIA_EXTERNA },
        { x: x + largura + DISTANCIA_EXTERNA, y: y - DISTANCIA_EXTERNA },
        { x: x - DISTANCIA_EXTERNA, y: y - DISTANCIA_EXTERNA }
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