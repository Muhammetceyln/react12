import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
    IconButton, Typography, Chip, Stack, Tooltip, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import {
    PlayCircleOutline as RunIcon,
    StopCircleOutlined as StopIcon,
    AddCircleOutline as CreateIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    HourglassTop as PendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import JobPopup from '../../popup/JobPopup.jsx';//popup

// --- BİLEŞENLER ---

const StatusIndicator = ({ status }) => {
    // Gelen status değerine göre durumu belirle
    let currentStatus = status;
    if (status === true) {
        currentStatus = 'Running';
    } else if (status === false) {
        currentStatus = 'Stopped';
    }

    const statusConfig = {
        'Stopped': { label: 'Stopped', color: 'error', icon: <StopIcon /> },
        'Running': { label: 'Running', color: 'success', icon: <RunIcon /> },
        'Pending': { label: 'Pending', color: 'warning', icon: <PendingIcon /> }
    };

    // Belirlenen duruma göre config'i al
    const config = statusConfig[currentStatus] || { label: 'Unknown', color: 'default' };

    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" variant="outlined" />;
};
// ANA SAYFA BİLEŞENİ
const JobPage = () => {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [loading, setLoading] = useState(false);
    // Silme onayı için state'ler
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deletingJobIds, setDeletingJobIds] = useState([]);
    const [deletingLoading, setDeletingLoading] = useState(false);

    const [templates, setTemplates] = useState([]);

    // API işlemleri için helper fonksiyonlar
    const getAuthToken = () => {
        return localStorage.getItem('authToken');
    };

    const apiCall = async (url, options = {}) => {
        const token = getAuthToken();
        const response = await fetch(`http://localhost:3001${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API hatası');
        }

        return response.json();
    };


    const fetchTemplates = useCallback(async () => {
        try {
            const data = await apiCall('/api/templates');
            setTemplates(data);
        } catch (error) {
            console.error('Error while loading templates:', error);
        }
    }, []);


    // Jobs listesini backend'den getir
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiCall('/api/jobs');
            // Template adını job listesine eklemek için template'leri kullan
            const jobsWithTemplateNames = data.map(job => {
                const template = templates.find(t => t.ID === job.templateId);
                return {
                    ...job,
                    id: job.ID, // Kolay erişim için
                    templateName: template ? template.TEMPLATE_NAME : 'N/A'
                };
            });
            setJobs(jobsWithTemplateNames);
        } catch (error) {
            console.error('Error while loading jobs:', error);
        } finally {
            setLoading(false);
        }
    }, [templates]); // templates değiştiğinde fetchJobs'u yeniden oluştur

    const startJob = async (job) => {
        try {
            await apiCall(`/api/jobs/${job.id}/start`, { method: 'POST' });
            await fetchJobs(); // Listeyi yeniden yükle
        } catch (error) {
            console.error('Error while starting job:', error);
        }
    };

    const stopJob = async (job) => {
        try {
            await apiCall(`/api/jobs/${job.id}/stop`, { method: 'POST' });
            await fetchJobs(); // Listeyi yeniden yükle
        } catch (error) {
            console.error('Error while stopping job:', error);
        }
    };

    useEffect(() => {
        // Component yüklendiğinde template'leri bir kere çek
        fetchTemplates();
    }, [fetchTemplates]);

    useEffect(() => {
        // Sadece template'ler yüklendikten sonra job'ları çek
        if (templates.length > 0) {
            fetchJobs();
        }
    }, [templates, fetchJobs]); // Artık fetchJobs yerine templates'e bağlı




    // Job kaydetme (oluşturma/güncelleme)
    const handleSaveJob = async (jobData) => {
        const { id, name, description, pattern, status, templateId } = jobData;
        const isEditing = !!id;

        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `/api/jobs/${id}` : '/api/jobs';
        const body = JSON.stringify({ name, description, pattern, status, templateId });

        try {
            await apiCall(url, { method, body });
            await fetchJobs(); // İşlem sonrası listeyi yenile
        } catch (error) {
            console.error('Job save error:', error);
            // Burada kullanıcıya bir bildirim (snackbar) göstermek faydalı olabilir.
        }
    };

    // Silme butonuna basıldığında onay penceresini açar
    const handleDeleteJob = (jobId) => {
        const idsToDelete = Array.isArray(jobId) ? jobId : [jobId];
        if (idsToDelete.length > 0) {
            setDeletingJobIds(idsToDelete);
            setConfirmOpen(true);
        }
    };

    // Onay penceresinde "Evet" denildiğinde gerçek silme işlemini yapar
    const confirmDeleteJob = async () => {
        if (deletingJobIds.length === 0) {
            setConfirmOpen(false);
            return;
        }
        setDeletingLoading(true);
        try {
            // Birden fazla job'ı silmek için Promise.all kullanabiliriz
            await Promise.all(deletingJobIds.map(id => apiCall(`/api/jobs/${id}`, { method: 'DELETE' })));
            setSelectedJobId(prev => Array.isArray(prev) ? prev.filter(id => !deletingJobIds.includes(id)) : null);
            await fetchJobs(); // İşlem sonrası listeyi yenile
        } catch (error) {
            console.error('Job delete error:', error);
        } finally {
            setDeletingLoading(false);
            setConfirmOpen(false);
            setDeletingJobIds([]);
        }
    };

    // Silme işlemini iptal et
    const cancelDeleteJob = () => {
        setConfirmOpen(false);
        setDeletingJobIds([]);
    };

    // Çoklu seçim state'i ve handler'ları (önceki adımdan)
    const [selectedJobIds, setSelectedJobIds] = useState([]);
    // Not: handleSelectAllClick ve handleSelectClick fonksiyonları
    // önceki adımdaki gibi burada olmalıdır. Bu diff sadece silme mantığını düzeltir.

    const selectedJob = jobs.find(j => j.id === selectedJobId);

    const handleRunStopToggle = () => { // 'e' parametresi kullanılmadığı için kaldırılabilir
        if (!selectedJob) return;

        // Kontrol 'Running' metni yerine 'true' boolean değeri ile yapılıyor
        if (selectedJob.status === true) {
            stopJob(selectedJob);
        } else {
            startJob(selectedJob);
        }
    };

    // YENİ STİL: Butonlar için ortak stil
    const actionButtonSx = {
        border: "1px solid #d0d7ff",
        bgcolor: "#f5f7ff",
        "&:hover": { bgcolor: "#eef3ff" },
    };

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 180px)' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Sheduled jobs
            </Typography>
            <Paper elevation={2} sx={{ mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1, }}>
                <Button variant="outlined" startIcon={<CreateIcon />} onClick={() => { setEditingJob(null); setPopupOpen(true); }}>Create</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                    variant="contained"
                    // BUTON stop run dönüştürme
                    startIcon={selectedJob?.status === true ? <StopIcon /> : <RunIcon />}
                    color={selectedJob?.status === true ? 'error' : 'success'}
                    onClick={handleRunStopToggle}
                    disabled={!selectedJob}
                >
                    {/* Burası da güncellendi */}
                    {selectedJob?.status === true ? 'Stop' : 'Run'}
                </Button>
            </Paper>
            <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {['ID', 'Name', 'Next Run Time', 'Template', 'Description', 'Status', 'Actions'].map(col => <TableCell key={col} sx={{ fontWeight: 'bold' }}>{col}</TableCell>)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id} hover onClick={() => setSelectedJobId(job.id)} selected={selectedJobId === job.id} sx={{ cursor: 'pointer' }}>
                                <TableCell>{job.id}</TableCell>
                                <TableCell>{job.NAME}</TableCell>
                                <TableCell>
                                    {/* 1. İşin durumu 'true' mu (çalışıyor mu)?
                                    2. Backend'den gelen 'NEXT_RUN_AT' alanı dolu mu?
                                    Bu iki koşul sağlanıyorsa tarihi formatla, aksi halde 'N/A' yaz.
                                    */}
                                    {(job.status === true && job.nextRun) ?
                                        format(new Date(job.nextRun), 'PPpp') :
                                        'N/A'
                                    }
                                </TableCell>
                                <TableCell>{job.templateName}</TableCell>
                                <TableCell>{job.description}</TableCell>
                                <TableCell><StatusIndicator status={job.status} /></TableCell>
                                <TableCell align="right">
                                    {/* YENİ STİL: Butonlar güncellendi */}
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Tooltip title="Edit">
                                            <IconButton size="small" color="primary" sx={actionButtonSx} onClick={(e) => { e.stopPropagation(); setEditingJob(job); setPopupOpen(true); }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" sx={actionButtonSx} onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}>
                                                {deletingLoading && deletingJobIds.includes(job.id) ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <JobPopup open={isPopupOpen} onClose={() => setPopupOpen(false)} onSave={handleSaveJob} job={editingJob} />

            {/* Silme Onay Penceresi */}
            <Dialog open={confirmOpen} onClose={cancelDeleteJob}>
                <DialogTitle>Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the selected job?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDeleteJob} disabled={deletingLoading}>Cancel</Button>
                    <Button onClick={confirmDeleteJob} variant="contained" color="error" disabled={deletingLoading}>
                        {deletingLoading ? <CircularProgress size={24} color="inherit" /> : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default JobPage;