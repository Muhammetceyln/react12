import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Button, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel,
    Select, MenuItem, IconButton, Typography, Chip, Stack, InputLabel, FormControl, Tooltip
} from '@mui/material';
import {
    PlayCircleOutline as RunIcon,
    StopCircleOutlined as StopIcon,
    AddCircleOutline as CreateIcon,
    DeleteOutline as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    HourglassTop as PendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { EditCalendar as EditPatternIcon } from '@mui/icons-material';
import PatternSelectorPopup from "../../popup/PatternSelectorPopup.jsx";

// --- BİLEŞENLER ---

const StatusIndicator = ({ status }) => {
    const statusConfig = {
        'Stopped': { label: 'Stopped', color: 'error', icon: <StopIcon /> },
        'Running': { label: 'Running', color: 'success', icon: <RunIcon /> },
        'Pending': { label: 'Pending', color: 'warning', icon: <PendingIcon /> }
    };
    const config = statusConfig[status] || { label: 'Unknown', color: 'default' };
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" variant="outlined" />;
};

const JobPopup = ({ open, onClose, onSave, job }) => {
    const [formData, setFormData] = useState({});
    const [isPatternPopupOpen, setPatternPopupOpen] = useState(false);

    useEffect(() => {
        if (job) {
            setFormData({ ...job });
        } else {
            setFormData({ name: '', description: '', enabled: true, object: 'Flow_1', pattern: '*/5 * * * * *' });
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
                            <Select name="object" value={formData.object || ''} label="Object (Flow)" onChange={handleChange}>
                                <MenuItem value="Flow_1">KalyonMii/Flows/Flow_1</MenuItem>
                                <MenuItem value="Flow_2">KalyonMii/Flows/Flow_2</MenuItem>
                                <MenuItem value="Flow_3">KalyonMii/Flows/Process_Data</MenuItem>
                            </Select>
                        </FormControl>
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
                        <FormControlLabel control={<Checkbox name="enabled" checked={formData.enabled || false} onChange={handleChange} />} label="Enabled (Start immediately after saving)" />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
            {<PatternSelectorPopup
                open={isPatternPopupOpen}
                onClose={() => setPatternPopupOpen(false)}
                onApply={handleApplyPattern}
                initialPattern={formData.pattern || ''}
            />}
        </>
    );
};

// ANA SAYFA BİLEŞENİ
const SchedulerPage = () => {
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [runningTasks, setRunningTasks] = useState({});

    // DÜZELTME: `cron-parser` yerine `setInterval` kullanarak daha stabil bir simülasyon
    const parseIntervalFromCron = (pattern) => {
        // Sadece '*/X * * * * *' formatını destekleyen basit bir parser
        const match = pattern.match(/^\*\/(\d+)/);
        if (match && match[1]) {
            return parseInt(match[1], 10) * 1000; // Milisaniyeye çevir
        }
        return null; // Geçersiz veya desteklenmeyen format
    };

    const startJob = useCallback((jobToStart) => {
        if (runningTasks[jobToStart.id]) return; // Zaten çalışıyorsa tekrar başlatma

        const intervalMs = parseIntervalFromCron(jobToStart.pattern);
        if (!intervalMs) {
            console.error(`Invalid or unsupported cron pattern for job ${jobToStart.name}: ${jobToStart.pattern}`);
            setJobs(prev => prev.map(j => j.id === jobToStart.id ? { ...j, status: 'Stopped', nextRunTime: 'Invalid Pattern' } : j));
            return;
        }

        const run = () => {
            console.log(`Job ${jobToStart.name} executed!`);
            setJobs(prev => prev.map(j => j.id === jobToStart.id ? { ...j, nextRunTime: new Date(Date.now() + intervalMs) } : j));
        };

        run(); // Hemen bir kere çalıştır ve sonraki zamanı ayarla
        const intervalId = setInterval(run, intervalMs);

        setRunningTasks(prev => ({ ...prev, [jobToStart.id]: intervalId }));
        setJobs(prev => prev.map(j => j.id === jobToStart.id ? { ...j, status: 'Running' } : j));

    }, [runningTasks]);

    const stopJob = useCallback((jobToStop) => {
        const intervalId = runningTasks[jobToStop.id];
        if (intervalId) {
            clearInterval(intervalId);
            setRunningTasks(prev => {
                const newTasks = { ...prev };
                delete newTasks[jobToStop.id];
                return newTasks;
            });
        }
        setJobs(prev => prev.map(j => j.id === jobToStop.id ? { ...j, status: 'Stopped', nextRunTime: null } : j));
    }, [runningTasks]);

    useEffect(() => {
        const initialJobs = [
            { id: 1, name: 'BRICK_PROCESS', description: 'Periodic Brick Data Processing', enabled: true, object: 'Flow_1', pattern: '*/10 * * * * *', status: 'Stopped', nextRunTime: null },
            { id: 2, name: 'CELL_DATA_TRANSFER', description: 'Transfer Cell Flash Data', enabled: false, object: 'Flow_2', pattern: '*/30 * * * * *', status: 'Stopped', nextRunTime: null },
        ];

        setJobs(initialJobs);
        initialJobs.forEach(job => {
            if (job.enabled) {
                startJob(job);
            }
        });

        return () => {
            Object.values(runningTasks).forEach(intervalId => clearInterval(intervalId));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSaveJob = (jobData) => {
        let savedJob;
        if (jobData.id) { // Edit
            setJobs(prev => prev.map(j => j.id === jobData.id ? jobData : j));
            savedJob = jobData;
        } else { // Create
            savedJob = { ...jobData, id: Date.now(), status: 'Stopped', nextRunTime: null };
            setJobs(prev => [...prev, savedJob]);
        }

        if (savedJob.enabled) {
            startJob(savedJob);
        } else {
            stopJob(savedJob);
        }
    };

    const handleDeleteJob = (jobId) => {
        stopJob(jobs.find(j => j.id === jobId));
        setJobs(prev => prev.filter(j => j.id !== jobId));
        if (selectedJobId === jobId) setSelectedJobId(null);
    };

    const selectedJob = jobs.find(j => j.id === selectedJobId);

    const handleRunStopToggle = () => {
        if (!selectedJob) return;
        if (selectedJob.status === 'Running') {
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
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
            <Paper elevation={2} sx={{ mb: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button variant="outlined" startIcon={<CreateIcon />} onClick={() => { setEditingJob(null); setPopupOpen(true); }}>Create</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" startIcon={selectedJob?.status === 'Running' ? <StopIcon /> : <RunIcon />} color={selectedJob?.status === 'Running' ? 'error' : 'success'} onClick={handleRunStopToggle} disabled={!selectedJob}>
                    {selectedJob?.status === 'Running' ? 'Stop' : 'Run'}
                </Button>
            </Paper>
            <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {['ID', 'Name', 'Next Run Time', 'Object', 'Description', 'Status', 'Actions'].map(col => <TableCell key={col} sx={{ fontWeight: 'bold' }}>{col}</TableCell>)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id} hover onClick={() => setSelectedJobId(job.id)} selected={selectedJobId === job.id} sx={{ cursor: 'pointer' }}>
                                <TableCell>{job.id}</TableCell>
                                <TableCell>{job.name}</TableCell>
                                <TableCell>{job.nextRunTime ? format(job.nextRunTime, 'PPpp') : 'N/A'}</TableCell>
                                <TableCell>{job.object}</TableCell>
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
                                                <DeleteIcon fontSize="small" />
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
        </Box>
    );
};

export default SchedulerPage;