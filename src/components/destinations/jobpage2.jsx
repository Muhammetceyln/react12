import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Button, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
    Tabs, Tab, TextField, Checkbox, FormControlLabel, Select, MenuItem, Grid, Typography, Chip, Stack, InputLabel, FormControl
} from '@mui/material';
import {
    PlayCircleOutline as RunJobIcon,
    StopCircleOutlined as StopSchedulerIcon,
    AddCircleOutline as CreateIcon,
    DeleteOutline as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Warning as PendingIcon,
    Stop as StoppedIcon,
    CheckCircle as CompletedIcon
} from '@mui/icons-material';

// --- ÖRNEK VERİ (API'den gelecek veriyi taklit eder) ---
const dummyJobs = [
    { id: 1020, name: 'BRICK_101', description: 'PROCESS BRICK 101', enabled: true, transaction: '...SEND_101_PERIODIC', status: 'Stopped', interval: 3, unit: 'seconds' },
    { id: 1018, name: 'BRICK_FLASH_DATA', description: 'GET BRICK FLASH DATA', enabled: true, transaction: '...TRANSFER_FLASH_DATA', status: 'Pending', interval: 5, unit: 'minutes' },
    { id: 1019, name: 'BRICK_FLASH_HISTORY', description: 'BRICK FLASH HIST TRANSFER', enabled: false, transaction: '...TRANSFER_FLASH_HISTORY', status: 'Stopped', interval: 1, unit: 'hours' },
    { id: 1026, name: 'CELL_101', description: 'PROCESS CELL 101', enabled: true, transaction: '...SEND_101_PERIODIC', status: 'Completed', interval: 10, unit: 'seconds' },
    { id: 1024, name: 'CELL_FLASH_DATA', description: 'GET CELL FLASH DATA', enabled: false, transaction: '...TRANSFER_FLASH_DATA', status: 'Pending', interval: 30, unit: 'minutes' },
];

// --- Status Göstergesi İçin Yardımcı Bileşen ---
const StatusIndicator = ({ status }) => {
    const statusConfig = {
        'Stopped': { label: 'Stopped', color: 'error', icon: <StoppedIcon /> },
        'Pending': { label: 'Pending', color: 'warning', icon: <PendingIcon /> },
        'Completed': { label: 'Completed', color: 'success', icon: <CompletedIcon /> },
    };
    const config = statusConfig[status] || { label: 'Unknown', color: 'default' };
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" />;
};

// --- ANA SAYFA BİLEŞENİ ---
const SchedulerPage = () => {
    // --- STATE'LER ---
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);

    // --- VERİ YÜKLEME ---
    useEffect(() => {
        setJobs(dummyJobs);
        if (dummyJobs.length > 0) {
            setSelectedJobId(dummyJobs[0].id);
        }
    }, []);

    const selectedJob = useMemo(() => jobs.find(job => job.id === selectedJobId), [jobs, selectedJobId]);

    useEffect(() => {
        if (selectedJob) {
            setFormData(selectedJob);
        }
        setIsEditing(false);
    }, [selectedJob]);

    // --- EVENT HANDLERS ---
    const handleTabChange = (event, newValue) => setActiveTab(newValue);

    const handleFormChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleEdit = () => setIsEditing(true);

    const handleCancel = () => {
        setFormData(selectedJob);
        setIsEditing(false);
    };

    const handleSave = () => {
        setJobs(prevJobs => prevJobs.map(job => job.id === selectedJobId ? formData : job));
        setIsEditing(false);
        // Burada API'ye PUT isteği atılabilir: await api.updateJob(formData);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', p: 2, bgcolor: '#f4f6f8' }}>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>Job Scheduler</Typography>

            <Paper elevation={2} sx={{ mb: 2, p: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', borderRadius: 2 }}>
                <Button variant="contained" startIcon={<RunJobIcon />} disabled={!selectedJob || isEditing}>Run Job</Button>
                <Button variant="contained" startIcon={<StopSchedulerIcon />} disabled={isEditing}>Stop Scheduler</Button>
                <Button variant="outlined" startIcon={<CreateIcon />} disabled={isEditing}>Create</Button>
                <Button variant="outlined" startIcon={<DeleteIcon />} disabled={!selectedJob || isEditing}>Delete</Button>
                {isEditing ? (
                    <>
                        <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave}>Save</Button>
                        <Button variant="outlined" color="secondary" startIcon={<CancelIcon />} onClick={handleCancel}>Cancel</Button>
                    </>
                ) : (
                    <Button variant="outlined" startIcon={<EditIcon />} disabled={!selectedJob} onClick={handleEdit}>Edit</Button>
                )}
            </Paper>

            <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                <TableContainer component={Paper}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {['ID', 'Name', 'Description', 'Status'].map(col => <TableCell key={col} sx={{ fontWeight: 'bold', bgcolor: 'grey.200' }}>{col}</TableCell>)}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {jobs.map((job) => (
                                <TableRow key={job.id} hover onClick={() => !isEditing && setSelectedJobId(job.id)} selected={selectedJobId === job.id} sx={{ cursor: isEditing ? 'not-allowed' : 'pointer' }}>
                                    <TableCell>{job.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{job.name}</TableCell>
                                    <TableCell>{job.description}</TableCell>
                                    <TableCell><StatusIndicator status={job.status} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Paper elevation={3} sx={{ mt: 2, borderRadius: 2 }}>
                <Typography sx={{ p: 2, fontWeight: 'bold' }}>Details for Job: {selectedJob?.name || 'Please select a job'}</Typography>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Scheduler" />
                    <Tab label="History" />
                </Tabs>

                {activeTab === 0 && formData && (
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={2}>
                                    <TextField name="name" label="Name" value={formData.name} onChange={handleFormChange} fullWidth disabled={!isEditing} />
                                    <TextField name="description" label="Description" value={formData.description} onChange={handleFormChange} fullWidth disabled={!isEditing} />
                                    <TextField name="transaction" label="Transaction Path" value={formData.transaction} onChange={handleFormChange} fullWidth disabled={!isEditing} />
                                    <FormControlLabel control={<Checkbox name="enabled" checked={formData.enabled} onChange={handleFormChange} disabled={!isEditing} />} label="Enabled" />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" sx={{ mb: 2 }}>Scheduling</Typography>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography sx={{ flexShrink: 0 }}>Repeat every</Typography>
                                    <TextField
                                        name="interval"
                                        type="number"
                                        value={formData.interval}
                                        onChange={handleFormChange}
                                        disabled={!isEditing}
                                        sx={{ width: '100px' }}
                                        InputProps={{ inputProps: { min: 1 } }}
                                    />
                                    <FormControl disabled={!isEditing} sx={{ minWidth: 120 }}>
                                        <InputLabel>Unit</InputLabel>
                                        <Select name="unit" value={formData.unit} label="Unit" onChange={handleFormChange}>
                                            <MenuItem value="seconds">Seconds</MenuItem>
                                            <MenuItem value="minutes">Minutes</MenuItem>
                                            <MenuItem value="hours">Hours</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                                    (This job will run every {formData.interval} {formData.unit})
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                )}
                {activeTab === 1 && <Box sx={{ p: 3 }}>Job history will be shown here.</Box>}
            </Paper>
        </Box>
    );
};

export default SchedulerPage;