/**
 * @file PatternSelectorPopup.jsx
 * @description 5 haneli standart cron ifadelerini görsel olarak oluşturmak için sekmeli bir arayüz sağlar.
 */
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel,
    Select, MenuItem, Typography, Stack, Tabs, Tab, FormGroup, RadioGroup, Radio, Button, Paper
} from '@mui/material';

// --- State yapısı yeni 'Minutes' sekmesini içerecek şekilde güncellendi ---
const initialState = {
    activeTab: 0, // 0: Minutes, 1: Hourly, 2: Daily, 3: Monthly
    minutes: {
        everyXMinutes: '5',
    },
    hourly: {
        runType: 'everyHour',
        everyXHours: '1',
        atMinute: '0',
    },
    daily: {
        runAt: '00:00',
        dayType: 'everyDay',
    },
    monthly: {
        runAt: '00:00',
        day: '1',
    },
    daysOfWeek: { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true },
    months: { Jan: true, Feb: true, Mar: true, Apr: true, May: true, Jun: true, Jul: true, Aug: true, Sep: true, Oct: true, Nov: true, Dec: true },
};

const PatternSelectorPopup = ({ open, onClose, onApply, initialPattern }) => {
    const [schedule, setSchedule] = useState(initialState);

    useEffect(() => {
        // Daily sekmesi için otomatik checkbox yönetimi (yeni index'e göre güncellendi)
        if (schedule.activeTab === 2) {
            const { dayType } = schedule.daily;
            if (dayType === 'everyDay') {
                setSchedule(prev => ({ ...prev, daysOfWeek: { Sun: true, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true } }));
            } else if (dayType === 'weekdays') {
                setSchedule(prev => ({ ...prev, daysOfWeek: { Sun: false, Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false } }));
            }
        }
    }, [schedule.daily.dayType, schedule.activeTab]);

    const handleStateChange = (part, key, value) => {
        setSchedule(prev => ({ ...prev, [part]: { ...prev[part], [key]: value } }));
    };

    const handleCheckboxGroup = (part, event) => {
        if (part === 'daysOfWeek' && schedule.activeTab === 2) {
            handleStateChange('daily', 'dayType', 'selectedDays');
        }
        setSchedule(prev => ({ ...prev, [part]: { ...prev[part], [event.target.name]: event.target.checked } }));
    };

    const handleApply = () => {
        let cron = ['*', '*', '*', '*', '*']; // [minute, hour, dayOfMonth, month, dayOfWeek]
        const { activeTab, minutes, hourly, daily, monthly, daysOfWeek, months } = schedule;

        const monthMap = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
        const selectedMonths = Object.keys(months).filter(m => months[m]).map(m => monthMap[m]);
        cron[3] = selectedMonths.length === 12 ? '*' : selectedMonths.join(',');

        const dayOfWeekMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const selectedDays = Object.keys(daysOfWeek).filter(d => daysOfWeek[d]).map(d => dayOfWeekMap[d]);
        const dayOfWeekPart = selectedDays.length === 7 ? '*' : selectedDays.join(',');

        if (activeTab === 0) { // Minutes
            cron[0] = `*/${minutes.everyXMinutes}`;
            cron[4] = dayOfWeekPart;
        } else if (activeTab === 1) { // Hourly
            cron[0] = hourly.atMinute;
            cron[1] = hourly.runType === 'everyHour' ? '*' : `*/${hourly.everyXHours}`;
            cron[4] = dayOfWeekPart;
        } else if (activeTab === 2) { // Daily
            const [hour, minute] = daily.runAt.split(':');
            cron[0] = parseInt(minute, 10).toString();
            cron[1] = parseInt(hour, 10).toString();
            if (daily.dayType === 'everyDay') cron[4] = '*';
            else if (daily.dayType === 'weekdays') cron[4] = '1-5';
            else cron[4] = selectedDays.length > 0 ? dayOfWeekPart : '7';
        } else if (activeTab === 3) { // Monthly
            const [hour, minute] = monthly.runAt.split(':');
            cron[0] = parseInt(minute, 10).toString();
            cron[1] = parseInt(hour, 10).toString();
            cron[2] = monthly.day;
            cron[4] = '?';
        }

        if (cron[3] === '') cron[3] = '13';
        if (cron[4] === '' && activeTab !== 3) cron[4] = '7';

        onApply(cron.join(' '));
        onClose();
    };

    const isDailyCheckboxDisabled = schedule.activeTab === 2 && (schedule.daily.dayType === 'everyDay' || schedule.daily.dayType === 'weekdays');

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md">
            <DialogTitle>Select Pattern</DialogTitle>
            <DialogContent sx={{ bgcolor: '#f0f0f0' }}>
                <Tabs value={schedule.activeTab} onChange={(e, val) => setSchedule(p => ({ ...p, activeTab: val }))} sx={{ mb: 2 }}>
                    <Tab label="Minutes" />
                    <Tab label="Hourly" />
                    <Tab label="Daily" />
                    <Tab label="Monthly" />
                </Tabs>

                {schedule.activeTab === 0 && ( /* Minutes */
                    <Stack spacing={2}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Typography component="span">Every</Typography>
                                <Select size="small" value={schedule.minutes.everyXMinutes} onChange={(e) => handleStateChange('minutes', 'everyXMinutes', e.target.value)}>
                                    {[1, 5, 10, 15, 20, 30].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                                <Typography component="span">Minute(s)</Typography>
                            </Stack>
                        </Paper>
                    </Stack>
                )}

                {schedule.activeTab === 1 && ( /* Hourly */
                    <Stack spacing={2}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <RadioGroup row value={schedule.hourly.runType} onChange={(e) => handleStateChange('hourly', 'runType', e.target.value)}>
                                <FormControlLabel value="everyHour" control={<Radio />} label="Every Hour" />
                                <FormControlLabel value="everyXHours" control={<Radio />} label={
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <span>Every</span>
                                        <Select size="small" value={schedule.hourly.everyXHours} onChange={(e) => handleStateChange('hourly', 'everyXHours', e.target.value)}>{Array.from({ length: 23 }, (_, i) => i + 1).map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}</Select>
                                        <span>Hour(s)</span>
                                    </Stack>} />
                            </RadioGroup>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1">At Minute</Typography>
                            <Select size="small" value={schedule.hourly.atMinute} onChange={(e) => handleStateChange('hourly', 'atMinute', e.target.value)}>{Array.from({ length: 60 }, (_, i) => i).map(m => <MenuItem key={m} value={m}>{String(m).padStart(2, '0')}</MenuItem>)}</Select>
                        </Paper>
                    </Stack>
                )}

                {schedule.activeTab === 2 && ( /* Daily */
                    <Stack spacing={2}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1">Run Job At</Typography>
                            <TextField type="time" value={schedule.daily.runAt} onChange={(e) => handleStateChange('daily', 'runAt', e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1">Run On</Typography>
                            <RadioGroup value={schedule.daily.dayType} onChange={(e) => handleStateChange('daily', 'dayType', e.target.value)}>
                                <FormControlLabel value="everyDay" control={<Radio />} label="Every Day" />
                                <FormControlLabel value="weekdays" control={<Radio />} label="Weekdays Only" />
                                <FormControlLabel value="selectedDays" control={<Radio />} label="Selected Days of the Week" />
                            </RadioGroup>
                            <FormGroup row>
                                {Object.keys(schedule.daysOfWeek).map(day => (
                                    <FormControlLabel key={day} control={<Checkbox checked={schedule.daysOfWeek[day]} onChange={(e) => handleCheckboxGroup('daysOfWeek', e)} name={day} disabled={isDailyCheckboxDisabled} />} label={day} />
                                ))}
                            </FormGroup>
                        </Paper>
                    </Stack>
                )}

                {schedule.activeTab === 3 && ( /* Monthly */
                    <Stack spacing={2}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1">Run Job At</Typography>
                            <TextField type="time" value={schedule.monthly.runAt} onChange={(e) => handleStateChange('monthly', 'runAt', e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1">Run On Day of Month</Typography>
                            <Select size="small" value={schedule.monthly.day} onChange={(e) => handleStateChange('monthly', 'day', e.target.value)}>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}</Select>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1">Run in Months</Typography>
                            <FormGroup row>{Object.keys(schedule.months).map(month => (<FormControlLabel key={month} control={<Checkbox checked={schedule.months[month]} onChange={(e) => handleCheckboxGroup('months', e)} name={month} />} label={month} />))}</FormGroup>
                        </Paper>
                    </Stack>
                )}

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleApply} variant="contained">OK</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PatternSelectorPopup;