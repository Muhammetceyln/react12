import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel,
    Select, MenuItem, IconButton, Stack, InputLabel, FormControl, Box, Button
} from '@mui/material';
// YENİ: İkon importu eklendi
import { EditCalendar as EditPatternIcon } from '@mui/icons-material';

// Bu bileşenin, projenizde PatternSelectorPopup.jsx olarak var olduğunu varsayıyoruz.
// import PatternSelectorPopup from './PatternSelectorPopup.jsx';

// JobPopup bileşeni, ana form
const JobPopup = ({ open, onClose, onSave, job }) => {
    const [formData, setFormData] = useState({});
    // YENİ: Pattern popup'ının görünürlüğünü kontrol eden state
    const [isPatternPopupOpen, setPatternPopupOpen] = useState(false);

    useEffect(() => {
        if (open) {
            if (job) {
                setFormData({ ...job });
            } else {
                setFormData({ name: '', description: '', enabled: true, object: 'Flow_1', pattern: '*/5 * * * *' });
            }
        }
    }, [job, open]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    // YENİ: Pattern popup'ından seçilen yeni cron desenini state'e uygulayan fonksiyon
    const handleApplyPattern = (newPattern) => {
        setFormData(prev => ({ ...prev, pattern: newPattern }));
        setPatternPopupOpen(false); // Pattern seçildikten sonra popup'ı kapat
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>{job ? 'Edit Job' : 'Create New Job'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField name="name" label="Name" value={formData.name || ''} onChange={handleChange} fullWidth />
                        <TextField name="description" label="Description" value={formData.description || ''} onChange={handleChange} fullWidth />
                        <FormControl fullWidth>
                            <InputLabel>Object (Flow)</InputLabel>
                            <Select name="object" value={formData.object || 'Flow_1'} label="Object (Flow)" onChange={handleChange}>
                                <MenuItem value="Flow_1">KalyonMii/Flows/Flow_1</MenuItem>
                                <MenuItem value="Flow_2">KalyonMii/Flows/Flow_2</MenuItem>
                                <MenuItem value="Flow_3">KalyonMii/Flows/Process_Data</MenuItem>
                            </Select>
                        </FormControl>

                        {/* GÜNCELLEME: TextField ve Buton bir Box içine alındı */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                                name="pattern"
                                label="Pattern (Cron Expression)"
                                value={formData.pattern || ''}
                                fullWidth
                                // GÜNCELLEME: Sadece okunur yapıldı ve helper text güncellendi
                                InputProps={{ readOnly: true }}
                                helperText="Click the icon to build a pattern visually"
                            />
                            <IconButton color="primary" onClick={() => setPatternPopupOpen(true)}>
                                <EditPatternIcon />
                            </IconButton>
                        </Box>

                        <FormControlLabel control={<Checkbox name="enabled" checked={Boolean(formData.enabled)} onChange={handleChange} />} label="Enabled" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* YENİ: PatternSelectorPopup'ı burada çağırıyoruz */}
            {/* Bu component'in projenizde var olduğunu ve onApply prop'unu aldığını varsayıyoruz. */}
            {<PatternSelectorPopup
                open={isPatternPopupOpen}
                onClose={() => setPatternPopupOpen(false)}
                onApply={handleApplyPattern}
                initialPattern={formData.pattern || ''}
            />}
        </>
    );
};

export default JobPopup;