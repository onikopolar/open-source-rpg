// Arquivo: src/components/modals/ChangePictureModal.jsx
// Versão: 5.13.2 - FIX: Debug do FormData e timestamp para cache
console.log('[ChangePictureModal] Versão 5.13.2 - Fix: Debug do FormData e timestamp para cache');

import React, { useEffect, useState, useCallback } from 'react';
import { withStyles } from '@mui/styles';
import {
    TextField, Dialog, DialogActions, DialogContent,
    DialogTitle, Button, Grid, Link, Tabs, Tab,
    Box, IconButton
} from '@mui/material';
import Cropper from 'react-easy-crop';
import { Close as CloseIcon, CloudUpload as UploadIcon } from '@mui/icons-material';

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
        marginTop: 15,
    },
    previewImage: {
        maxWidth: '100%',
        maxHeight: 200,
        borderRadius: 4,
    },
    tabPanel: {
        paddingTop: 15,
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
    
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        console.log('[ChangePictureModal] useEffect - character atual:', character);
        
        if (character) {
            console.log('[ChangePictureModal] Carregando URLs do character:', {
                standard: character.standard_character_picture_url,
                injured: character.injured_character_picture_url
            });
            
            setPictureURLs({
                standard_character_picture_url: character.standard_character_picture_url || '',
                injured_character_picture_url: character.injured_character_picture_url || ''
            });
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
        console.log('[ChangePictureModal] Iniciando upload para:', type);
        
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

        console.log('[ChangePictureModal] Character ID válido:', character.id, '(tipo:', typeof character.id, ')');

        setUploading(true);
        try {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
            
            const formData = new FormData();
            formData.append('image', blob, `${character.id}-${type}.png`);
            formData.append('type', type);
            formData.append('characterId', character.id.toString()); // Garantir que seja string
            
            // DEBUG: Verificar conteúdo do FormData
            console.log('[ChangePictureModal] Conteúdo do FormData antes do envio:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof Blob) {
                    console.log(`  ${key}: [Blob] tamanho=${value.size}, tipo=${value.type}`);
                } else {
                    console.log(`  ${key}: ${value} (tipo: ${typeof value})`);
                }
            }

            console.log('[ChangePictureModal] Enviando para API...');
            
            const response = await api.post('/uploads/character-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('[ChangePictureModal] Resposta da API:', response.data);

            setPictureURLs(prev => ({
                ...prev,
                [type === 'standard' ? 'standard_character_picture_url' : 'injured_character_picture_url']: response.data.url
            }));

            // CHAMAR CALLBACK PARA ATUALIZAR DADOS NO COMPONENTE PAI
            if (onPictureChange && typeof onPictureChange === 'function') {
                console.log('[ChangePictureModal] Chamando onPictureChange callback');
                onPictureChange();
            } else {
                console.warn('[ChangePictureModal] onPictureChange não disponível ou não é função');
            }

            window.alert('Imagem enviada com sucesso! A página será atualizada.');
            setImageSrc(null);
            
        } catch (error) {
            console.error('[ChangePictureModal] Erro no upload:', error);
            console.error('[ChangePictureModal] Detalhes do erro:', error.response?.data || error.message);
            window.alert('Erro ao enviar imagem: ' + (error.message || 'Erro desconhecido. Verifique o console.'));
        } finally {
            setUploading(false);
        }
    };

    const submit = () => {
        console.log('[ChangePictureModal] Submetendo alterações...');
        
        if(!pictureURLs.injured_character_picture_url || !pictureURLs.standard_character_picture_url) {
            window.alert('Preencha as duas artes!');
            return;
        }

        const allowedWebsites = ['discord', 'imgur'];

        if(!allowedWebsites.some(website => pictureURLs.injured_character_picture_url.includes(website))) {
            window.alert('Preencha as duas artes com URLs válidas!');
            return;
        }

        if(!allowedWebsites.some(website => pictureURLs.standard_character_picture_url.includes(website))) {
            window.alert('Preencha as duas artes com URLs válidas!');
            return;
        }

        if(!pictureURLs.injured_character_picture_url.endsWith('.png') || !pictureURLs.standard_character_picture_url.endsWith('.png')) {
            window.alert('As artes precisam estar em formato PNG.');
            return;
        }

        if (!character || !character.id) {
            console.error('[ChangePictureModal] character não definido no submit');
            window.alert('Personagem não encontrado!');
            return;
        }

        console.log('[ChangePictureModal] Enviando para API PUT...');

        api.put(`/character/${character.id}`, {
            injured_character_picture_url: pictureURLs.injured_character_picture_url,
            standard_character_picture_url: pictureURLs.standard_character_picture_url
        })
            .then(() => {
                console.log('[ChangePictureModal] Alterações salvas com sucesso');
                
                // CHAMAR CALLBACK APÓS SALVAR ALTERAÇÕES DE URL TAMBÉM
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
                    <Tab label="Por URL" />
                    <Tab label="Upload + Crop" />
                </Tabs>

                <Box className={classes.tabPanel}>
                    {activeTab === 0 ? (
                        <Grid container>
                            <Grid item xs={12}>
                                <p>
                                    As artes dos personagens devem estar <strong>obrigatoriamente</strong> no tamanho <strong>420x600</strong> e em formato <strong>PNG</strong>.
                                </p>
                                <p>
                                    Apenas são aceitos links de imagens upadas no site <Link href="https://imgur.com/" target="_blank">Imgur</Link> ou no Discord.
                                </p>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    style={{ marginTop: '15px' }}
                                    autoFocus
                                    label="Imagem padrão"
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    value={pictureURLs.standard_character_picture_url}
                                    onChange={({ target }) => {
                                        setPictureURLs(prevState => ({
                                            ...prevState,
                                            standard_character_picture_url: target.value
                                        }));
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    style={{ marginTop: '15px' }}
                                    label="Imagem machucada"
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    value={pictureURLs.injured_character_picture_url}
                                    onChange={({ target }) => {
                                        setPictureURLs(prevState => ({
                                            ...prevState,
                                            injured_character_picture_url: target.value
                                        }));
                                    }}
                                />
                            </Grid>
                        </Grid>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <p>
                                    Selecione uma imagem, ajuste o crop para 420x600 e faça upload separadamente para cada tipo.
                                </p>
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
                                        <p><small>Formatos: JPG, PNG, GIF</small></p>
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
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={() => handleUploadImage('standard')}
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Enviando...' : 'Usar como Imagem Padrão'}
                                        </Button>
                                        {pictureURLs.standard_character_picture_url && (
                                            <div className={classes.previewContainer}>
                                                <img 
                                                    src={pictureURLs.standard_character_picture_url} 
                                                    alt="Preview Padrão"
                                                    className={classes.previewImage}
                                                />
                                            </div>
                                        )}
                                    </Grid>

                                    <Grid item xs={6}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            onClick={() => handleUploadImage('injured')}
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Enviando...' : 'Usar como Imagem Machucada'}
                                        </Button>
                                        {pictureURLs.injured_character_picture_url && (
                                            <div className={classes.previewContainer}>
                                                <img 
                                                    src={pictureURLs.injured_character_picture_url} 
                                                    alt="Preview Machucado"
                                                    className={classes.previewImage}
                                                />
                                            </div>
                                        )}
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
                    Salvar Alterações
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default withStyles(styles)(ChangePictureModal);