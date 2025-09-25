import React, { useState, useEffect } from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Checkbox, FormControlLabel, Select, MenuItem, IconButton, Stack,
    InputLabel, FormControl, Snackbar, Alert, CircularProgress, Typography
} from '@mui/material';
import { EditCalendar as EditPatternIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import PatternSelectorPopup from "../popup/PatternSelectorPopup.jsx";

const JobPopup = ({ open, onClose, onSave, job }) => {
    // --- State'ler ---
    const [formData, setFormData] = useState({});
    const [isPatternPopupOpen, setPatternPopupOpen] = useState(false);

    // Template'ler için state'ler
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // Genel state'ler
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, severity: "info", message: "" });

    // --- API Çağrıları ---
    const getAuthToken = () => localStorage.getItem('authToken');

    // TEMPLATELERİ GETİRMEK İÇİN KULLANILAN FONKSİYON
    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const token = getAuthToken();
            if (!token) {
                setSnackbar({ open: true, severity: 'error', message: 'Yetkilendirme token\'ı bulunamadı.' });
                return;
            }

            // GET isteği atılıyor, method veya body belirtmeye gerek yok.
            const response = await fetch('http://localhost:3001/api/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates(data || []);
            } else {
                // 401 hatası genellikle token süresinin dolmasından kaynaklanır.
                if (response.status === 401) {
                    setSnackbar({ open: true, severity: 'error', message: 'Oturum süreniz dolmuş. Lütfen yeniden giriş yapın.' });
                } else {
                    setSnackbar({ open: true, severity: 'error', message: 'Template listesi yüklenemedi.' });
                }
            }
        } catch (err) {
            console.error('Template fetch error:', err);
            setSnackbar({ open: true, severity: 'error', message: 'Sunucuya bağlanırken bir hata oluştu.' });
        } finally {
            setLoadingTemplates(false);
        }
    };

    // --- useEffect --- 
    useEffect(() => {
        if (open) {
            fetchTemplates();

            if (job) { // Düzenleme modu
                setFormData({
                    id: job.id,
                    name: job.NAME || '',
                    description: job.description || '',

                    templateId: job.templateId || '', // Use lowercase 'templateId'
                    pattern: job.pattern || '0 */5 * * *',
                });
            } else { // Yeni oluşturma modu
                setFormData({
                    name: '',
                    description: '',
                    status: false,
                    templateId: '',
                    pattern: '0 */5 * * *'
                });
            }
        }
    }, [job, open]);

    // --- Handler Fonksiyonları ---
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.templateId || !formData.pattern) {
            setSnackbar({ open: true, severity: 'warning', message: 'Name, Template, ve Pattern alanları zorunludur.' });
            return;
        }
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            setSnackbar({ open: true, severity: 'error', message: `Kaydetme başarısız: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPattern = (newPattern) => {
        setFormData(prev => ({ ...prev, pattern: newPattern }));
        setPatternPopupOpen(false);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="h6">{job ? 'Edit Job' : 'Create New Job'}</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField name="name" label="Name" value={formData.name || ''} onChange={handleChange} fullWidth />
                        <TextField name="description" label="Description" value={formData.description || ''} onChange={handleChange} fullWidth />

                        <FormControl fullWidth>
                            <InputLabel id="template-select-label">Template</InputLabel>
                            <Select
                                labelId="template-select-label"
                                name="templateId"
                                value={formData.templateId || ''}
                                label="Template"
                                onChange={handleChange}
                                disabled={loadingTemplates}
                            >
                                {loadingTemplates ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={16} sx={{ mr: 1 }} /> Yükleniyor...
                                    </MenuItem>
                                ) : (
                                    [
                                        <MenuItem key="empty" value=""><em>Seçiniz...</em></MenuItem>,
                                        ...templates.map(template => (
                                            <MenuItem key={template.ID} value={template.ID}>
                                                {template.TEMPLATE_NAME}
                                            </MenuItem>
                                        ))
                                    ]
                                )}
                            </Select>
                        </FormControl>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                name="pattern"
                                label="Pattern (Cron Expression)"
                                value={formData.pattern || ''}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                helperText="Click the icon to build a pattern visually"
                            />
                            <IconButton color="primary" onClick={() => setPatternPopupOpen(true)}>
                                <EditPatternIcon />
                            </IconButton>
                        </Box>
                        {/* eğer workbenchdeki gibi enabled deyince çalışan button istenirse direkt burda hazır.
                        <FormControlLabel control={<Checkbox name="status" checked={formData.status || false} onChange={handleChange} />} label="Status" />
                        */}
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            <PatternSelectorPopup
                open={isPatternPopupOpen}
                onClose={() => setPatternPopupOpen(false)}
                onApply={handleApplyPattern}
                initialPattern={formData.pattern || ''}
            />

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default JobPopup;