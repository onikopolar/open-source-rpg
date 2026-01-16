// Arquivo: src/components/modals/ChangePictureModal.jsx
// Versão: 6.2.1 - FIX: Removido fundo branco do preview, ajustes visuais menores
console.log('[ChangePictureModal] Versão 6.2.1 - FIX: Fundo branco removido, ajustes de layout');

import React, { useEffect, useState, useCallback } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent,
    DialogTitle, Button, Grid, Link, Tabs, Tab,
    Box, IconButton, Typography
} from '@mui/material';
import Cropper from 'react-easy-crop';
import { Close as CloseIcon, CloudUpload as UploadIcon, Check as CheckIcon } from '@mui/icons-material';

import { api } from '../../utils';

const styles = theme => ({
    cropContainer: {
        position: 'relative',
        width: '100%',
        height: 300,
        background: '#333',
        marginTop: 15,
    },
    controls: {
        marginTop: 15,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    sliderContainer: {
        display: 'flex',
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    slider: {
        flex: 1,
        marginLeft: 10,
        marginRight: 10,
    },
    uploadArea: {
        border: '2px dashed #ccc',
        borderRadius: 4,
        padding: 40,
        textAlign: 'center',
        cursor: 'pointer',
        marginTop: 15,
        '&:hover': {
            borderColor: theme.palette.primary.main,
        },
    },
    previewContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    previewImage: {
        maxWidth: '100%',
        maxHeight: 200,
        borderRadius: 4,
        border: '2px solid #696969ff',
    },
    tabPanel: {
        paddingTop: 15,
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottom: '1px solid #e0e0e0',
    },
    previewBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: 10,
        padding: '2px 8px',
        backgroundColor: '#4caf50',
        color: 'white',
        borderRadius: 12,
        fontSize: '0.75rem',
        fontWeight: 'bold',
    },
    previewLabel: {
        fontSize: '0.85rem',
        color: '#ffffffff',
        marginBottom: 4,
        textAlign: 'center',
        fontWeight: '500',
    },
    uploadPreviewLabel: {
        fontSize: '0.85rem',
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: '500',
        fontStyle: 'italic',
    },
});

function ChangePictureModal({
    classes,
    handleClose,
    character,
    onPictureChange
}) {
    console.log('[ChangePictureModal] Iniciando modal com character:', character ? `ID: ${character.id}` : 'character não definido');
    console.log('[ChangePictureModal] Callback onPictureChange disponível:', !!onPictureChange);

    const [activeTab, setActiveTab] = useState(0);
    const [pictureURLs, setPictureURLs] = useState({
        standard_character_picture_url: '',
        injured_character_picture_url: ''
    });
    
    const [base64Images, setBase64Images] = useState({
        standard_base64: null,
        injured_base64: null
    });
    
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        console.log('[ChangePictureModal] useEffect - character atual:', character);
        
        if (character) {
            console.log('[ChangePictureModal] Carregando dados do character:', {
                standardURL: character.standard_character_picture_url,
                injuredURL: character.injured_character_picture_url,
                temStandardBase64: !!character.standard_character_image,
                temInjuredBase64: !!character.injured_character_image
            });
            
            setPictureURLs({
                standard_character_picture_url: character.standard_character_picture_url || '',
                injured_character_picture_url: character.injured_character_picture_url || ''
            });
            
            if (character.standard_character_image) {
                setBase64Images(prev => ({
                    ...prev,
                    standard_base64: character.standard_character_image
                }));
            }
            
            if (character.injured_character_image) {
                setBase64Images(prev => ({
                    ...prev,
                    injured_base64: character.injured_character_image
                }));
            }
        } else {
            console.warn('[ChangePictureModal] character é undefined ou null');
        }
    }, [character]);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        console.log('[ChangePictureModal] Crop completo:', croppedAreaPixels);
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        console.log('[ChangePictureModal] Gerando imagem cropada');
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 420;
        canvas.height = 600;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            420,
            600
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                console.log('[ChangePictureModal] Blob criado, tamanho:', blob?.size, 'tipo:', blob?.type);
                resolve(blob);
            }, 'image/png');
        });
    };

    const handleFileChange = (e) => {
        console.log('[ChangePictureModal] Arquivo selecionado:', e.target.files?.[0]?.name);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                console.log('[ChangePictureModal] Arquivo carregado como data URL');
                setImageSrc(reader.result);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleUploadImage = async (type) => {
        console.log('[ChangePictureModal] Iniciando upload para:', type, 'usando endpoint de uploads');
        
        if (!imageSrc || !croppedAreaPixels) {
            console.warn('[ChangePictureModal] Imagem ou crop não selecionado');
            window.alert('Selecione e ajuste a imagem primeiro!');
            return;
        }

        if (!character) {
            console.error('[ChangePictureModal] character é undefined no upload');
            window.alert('Erro: Personagem não encontrado. Feche e abra o modal novamente.');
            return;
        }

        if (!character.id) {
            console.error('[ChangePictureModal] character.id é undefined:', character);
            window.alert('Erro: ID do personagem não encontrado. Verifique se o personagem foi carregado corretamente.');
            return;
        }

        console.log('[ChangePictureModal] Character ID válido:', character.id);

        setUploading(true);
        try {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
            
            console.log('[ChangePictureModal] Preparando FormData para envio');
            
            const formData = new FormData();
            formData.append('image', blob, 'character-image.png');
            formData.append('characterId', character.id.toString());
            formData.append('type', type);

            console.log('[ChangePictureModal] Enviando para /api/uploads/character-image');
            
            const response = await api.post('/uploads/character-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('[ChangePictureModal] Upload concluído:', response.data);

            const dataURL = response.data.url;
            
            if (type === 'standard') {
                setBase64Images(prev => ({
                    ...prev,
                    standard_base64: dataURL
                }));
                setPictureURLs(prev => ({
                    ...prev,
                    standard_character_picture_url: ''
                }));
            } else {
                setBase64Images(prev => ({
                    ...prev,
                    injured_base64: dataURL
                }));
                setPictureURLs(prev => ({
                    ...prev,
                    injured_character_picture_url: ''
                }));
            }

            if (onPictureChange && typeof onPictureChange === 'function') {
                console.log('[ChangePictureModal] Chamando onPictureChange callback');
                onPictureChange();
                
                console.log('[ChangePictureModal] DEBUG: onPictureChange chamado. Preparando reload...');
                
                setTimeout(() => {
                    console.log('[ChangePictureModal] DEBUG: Forçando reload da página para atualizar imagem');
                    window.location.reload();
                }, 2000);
            } else {
                console.warn('[ChangePictureModal] onPictureChange não disponível ou não é função');
            }

            window.alert('Imagem salva com sucesso no banco de dados! A página será recarregada em 2 segundos.');
            setImageSrc(null);
            
        } catch (error) {
            console.error('[ChangePictureModal] Erro no upload:', error);
            console.error('[ChangePictureModal] Detalhes do erro:', error.response?.data || error.message);
            window.alert('Erro ao salvar imagem: ' + (error.message || 'Erro desconhecido. Verifique o console.'));
        } finally {
            setUploading(false);
        }
    };

    const submit = () => {
        console.log('[ChangePictureModal] Submetendo alterações...');
        
        const hasStandardImage = base64Images.standard_base64 || pictureURLs.standard_character_picture_url;
        const hasInjuredImage = base64Images.injured_base64 || pictureURLs.injured_character_picture_url;
        
        if(!hasStandardImage || !hasInjuredImage) {
            window.alert('Preencha as duas artes! Você pode usar upload ou URL.');
            return;
        }

        if (pictureURLs.standard_character_picture_url || pictureURLs.injured_character_picture_url) {
            const allowedWebsites = ['discord', 'imgur'];
            
            if (pictureURLs.standard_character_picture_url && 
                !allowedWebsites.some(website => pictureURLs.standard_character_picture_url.includes(website))) {
                window.alert('URL da imagem padrão inválida! Use apenas Imgur ou Discord.');
                return;
            }
            
            if (pictureURLs.injured_character_picture_url && 
                !allowedWebsites.some(website => pictureURLs.injured_character_picture_url.includes(website))) {
                window.alert('URL da imagem machucada inválida! Use apenas Imgur ou Discord.');
                return;
            }
        }

        if (!character || !character.id) {
            console.error('[ChangePictureModal] character não definido no submit');
            window.alert('Personagem não encontrado!');
            return;
        }

        console.log('[ChangePictureModal] Enviando todas as alterações para API...');

        const updateData = {
            injured_character_picture_url: pictureURLs.injured_character_picture_url || null,
            standard_character_picture_url: pictureURLs.standard_character_picture_url || null
        };

        api.put(`/character/${character.id}`, updateData)
            .then(() => {
                console.log('[ChangePictureModal] Alterações salvas com sucesso');
                
                if (onPictureChange && typeof onPictureChange === 'function') {
                    console.log('[ChangePictureModal] Chamando onPictureChange após salvar URLs');
                    onPictureChange();
                }
                
                handleClose();
            })
            .catch((error) => {
                console.error('[ChangePictureModal] Erro ao salvar:', error);
                window.alert('Erro ao salvar! Verifique o console para detalhes.');
            });
    };

    const getPreviewUrl = (type) => {
        if (type === 'standard') {
            return base64Images.standard_base64 || pictureURLs.standard_character_picture_url;
        } else {
            return base64Images.injured_base64 || pictureURLs.injured_character_picture_url;
        }
    };

    const hasPreview = (type) => {
        return !!(base64Images[`${type}_base64`] || pictureURLs[`${type === 'standard' ? 'standard' : 'injured'}_character_picture_url`]);
    };

    return (
        <Dialog
            open={true}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Alterar imagens do personagem
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Tabs value={activeTab} onChange={(e, newValue) => {
                    console.log('[ChangePictureModal] Mudando para aba:', newValue);
                    setActiveTab(newValue);
                }}>
                    <Tab label="Por URL (Imgur/Discord)" />
                    <Tab label="Upload + Crop (Salva no Banco)" />
                </Tabs>

                <Box className={classes.tabPanel}>
                    {activeTab === 0 ? (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="body2" paragraph>
                                    <strong>Modo URL:</strong> Cole URLs do Imgur ou Discord.
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    As artes devem estar no tamanho <strong>420x600</strong> e em formato <strong>PNG</strong>.
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    URLs aceitas: <Link href="https://imgur.com/" target="_blank">Imgur</Link> ou Discord.
                                </Typography>
                                <Typography variant="body2" color="primary" fontStyle="italic">
                                    Dica: Use esse modo pra links externos que já existem.
                                </Typography>
                            </Grid>

                            {/* Seção da Imagem Padrão */}
                            <Grid item xs={12}>
                                <div className={classes.sectionHeader}>
                                    <Typography variant="h6">
                                        Imagem Padrão
                                    </Typography>
                                    {hasPreview('standard') && (
                                        <span className={classes.previewBadge}>
                                            <CheckIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                            Preview disponível
                                        </span>
                                    )}
                                </div>

                                {hasPreview('standard') && (
                                    <div>
                                        <div className={classes.previewLabel}>
                                            Pré-visualização atual:
                                        </div>
                                        <div className={classes.previewContainer}>
                                            <img 
                                                src={getPreviewUrl('standard')} 
                                                alt="Preview Padrão"
                                                className={classes.previewImage}
                                            />
                                        </div>
                                    </div>
                                )}

                                <TextField
                                    autoFocus
                                    label="URL da Imagem Padrão"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={pictureURLs.standard_character_picture_url}
                                    onChange={({ target }) => {
                                        setPictureURLs(prevState => ({
                                            ...prevState,
                                            standard_character_picture_url: target.value
                                        }));
                                    }}
                                    helperText="Cole uma URL do Imgur ou Discord. Deixe vazio se já fez upload acima."
                                    placeholder="https://i.imgur.com/..."
                                />
                            </Grid>

                            {/* Seção da Imagem Machucada */}
                            <Grid item xs={12}>
                                <div className={classes.sectionHeader}>
                                    <Typography variant="h6">
                                        Imagem Machucada
                                    </Typography>
                                    {hasPreview('injured') && (
                                        <span className={classes.previewBadge}>
                                            <CheckIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                            Preview disponível
                                        </span>
                                    )}
                                </div>

                                {hasPreview('injured') && (
                                    <div>
                                        <div className={classes.previewLabel}>
                                            Pré-visualização atual:
                                        </div>
                                        <div className={classes.previewContainer}>
                                            <img 
                                                src={getPreviewUrl('injured')} 
                                                alt="Preview Machucado"
                                                className={classes.previewImage}
                                            />
                                        </div>
                                    </div>
                                )}

                                <TextField
                                    label="URL da Imagem Machucada"
                                    type="text"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={pictureURLs.injured_character_picture_url}
                                    onChange={({ target }) => {
                                        setPictureURLs(prevState => ({
                                            ...prevState,
                                            injured_character_picture_url: target.value
                                        }));
                                    }}
                                    helperText="Cole uma URL do Imgur ou Discord. Deixe vazio se já fez upload acima."
                                    placeholder="https://i.imgur.com/..."
                                />
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body2" paragraph>
                                    <strong>Modo Upload:</strong> A imagem é  salva diretamente no banco de dados (melhor opção).
                                </Typography>
                                <Typography variant="body2" paragraph>
                                    <strong>Vantagem:</strong> Funciona sem depender de serviços externos.
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#ff4d4dff', fontWeight: 'bold' }}>
                                    Importante: Imagens grandes podem dar problema. Use o crop abaixo pra otimizar.
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <input
                                    accept="image/*"
                                    type="file"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    id="upload-image"
                                />
                                <label htmlFor="upload-image">
                                    <div className={classes.uploadArea}>
                                        <UploadIcon style={{ fontSize: 40, color: '#666' }} />
                                        <p>Clique para selecionar uma imagem</p>
                                        <p><small>Formatos: JPG, PNG, GIF (será convertido para PNG 420x600)</small></p>
                                    </div>
                                </label>
                            </Grid>

                            {imageSrc && (
                                <>
                                    <Grid item xs={12}>
                                        <div className={classes.cropContainer}>
                                            <Cropper
                                                image={imageSrc}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={420 / 600}
                                                onCropChange={setCrop}
                                                onCropComplete={onCropComplete}
                                                onZoomChange={setZoom}
                                            />
                                        </div>
                                        <div className={classes.controls}>
                                            <div className={classes.sliderContainer}>
                                                <span>Zoom:</span>
                                                <input
                                                    type="range"
                                                    value={zoom}
                                                    min={1}
                                                    max={3}
                                                    step={0.1}
                                                    className={classes.slider}
                                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </Grid>

                                    <Grid item xs={6}>
                                        <div className={classes.sectionHeader}>
                                            <Typography variant="h6">
                                                Imagem Padrão
                                            </Typography>
                                        </div>
                                        
                                        {hasPreview('standard') && (
                                            <div>
                                                <div className={classes.uploadPreviewLabel}>
                                                    Imagem já salva:
                                                </div>
                                                <div className={classes.previewContainer}>
                                                    <img 
                                                        src={getPreviewUrl('standard')} 
                                                        alt="Preview Padrão"
                                                        className={classes.previewImage}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleUploadImage('standard')}
                                            disabled={uploading}
                                            sx={{ mt: 1 }}
                                        >
                                            {uploading ? 'Salvando...' : 'Salvar como Imagem Padrão'}
                                        </Button>
                                        <Typography variant="caption" display="block" textAlign="center" mt={0.5}>
                                            (Salva direto no banco via endpoint de uploads)
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={6}>
                                        <div className={classes.sectionHeader}>
                                            <Typography variant="h6">
                                                Imagem Machucada
                                            </Typography>
                                        </div>
                                        
                                        {hasPreview('injured') && (
                                            <div>
                                                <div className={classes.uploadPreviewLabel}>
                                                    Imagem já salva:
                                                </div>
                                                <div className={classes.previewContainer}>
                                                    <img 
                                                        src={getPreviewUrl('injured')} 
                                                        alt="Preview Machucado"
                                                        className={classes.previewImage}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleUploadImage('injured')}
                                            disabled={uploading}
                                            sx={{ mt: 1 }}
                                        >
                                            {uploading ? 'Salvando...' : 'Salvar como Imagem Machucada'}
                                        </Button>
                                        <Typography variant="caption" display="block" textAlign="center" mt={0.5}>
                                            (Salva direto no banco via endpoint de uploads)
                                        </Typography>
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="secondary">
                    Cancelar
                </Button>
                <Button onClick={submit} variant="contained" color="primary">
                    Salvar Todas as Alterações
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withStyles(styles)(ChangePictureModal);