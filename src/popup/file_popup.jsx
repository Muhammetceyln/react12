import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Box,
    Typography,
    CircularProgress,
    Snackbar,
    Alert,
    IconButton,
    MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * BapiPopup
 * - open: boolean -> dialog open/closed
 * - setOpen: fn -> function to be used to close dialog
 * - type: "HANA" | "SAP" | "MSSQL" -> which form will be displayed
 * - data: object -> item data received when Details is clicked (e.g., { host, instance, client, user, ... })
 * - onSave: fn -> kaydetme sonrası parent'a dönen callback
 * - page: string -> "sources" or "destination" to determine API endpoint
 */
export default function BapiPopup({ open, setOpen, type = "SAP", onSave, data, page, fromDetails, existingSources }) {

    // --- common states ---
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, severity: "info", message: "" });

    const [sourceName, setSourceName] = useState("");

    // MSSQL alanları
    const [mssqlHost, setMssqlHost] = useState("");
    const [mssqlIp, setMssqlIp] = useState("");
    const [mssqlPort, setMssqlPort] = useState("");
    const [mssqlDatabase, setMssqlDatabase] = useState("");
    const [mssqlUsername, setMssqlUsername] = useState("");
    const [mssqlPassword, setMssqlPassword] = useState("");

    // SAP alanları
    const [sapHost, setSapHost] = useState("");
    const [sapInstance, setSapInstance] = useState("");
    const [sapSysnr, setSapSysnr] = useState("");
    const [sapLanguage, setSapLanguage] = useState("");
    const [sapUser, setSapUser] = useState("");
    const [sapPassword, setSapPassword] = useState("");

    // HANA alanları
    const [hanaHost, setHanaHost] = useState("");
    const [hanaUsername, setHanaUsername] = useState("");
    const [hanaPassword, setHanaPassword] = useState("");
    const [hanaSchema, setHanaSchema] = useState("");
    const [hanaPort, setHanaPort] = useState("");

    // Yeni state'ler: Schema, Table, Column seçimi için
    const [schemas, setSchemas] = useState([]);
    const [selectedSchema, setSelectedSchema] = useState("");
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState("");
    const [columns, setColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState({});
    const [loadingSchemas, setLoadingSchemas] = useState(false);
    const [loadingTables, setLoadingTables] = useState(false);
    const [loadingColumns, setLoadingColumns] = useState(false);

    // Popup açıldığında gelen datayı forma doldur
    useEffect(() => {
        if (open) {
            // KOŞULU BASİTLEŞTİRİYORUZ:
            if (data) {
                // Eğer 'data' varsa (yani Edit veya Details modundaysak), formu doldur.
                setSourceName(data.name || ""); // Name alanını da dolduralım

                if (type === "SAP") {
                    setSapHost(data.details?.host || "");
                    setSapInstance(data.details?.instance || "");
                    setSapSysnr(data.details?.sysnr || "");
                    setSapLanguage(data.details?.language || "");
                    setSapUser(data.details?.user || "");
                    setSapPassword(data.details?.password || "");
                } else if (type === "MSSQL") {
                    setMssqlHost(data.details?.host || "");
                    setMssqlIp(data.details?.ip || "");
                    setMssqlPort(data.details?.port || "");
                    setMssqlDatabase(data.details?.database || "");
                    setMssqlUsername(data.details?.user || ""); // 'username' olmalı, 'user' değil
                    setMssqlPassword(data.details?.password || "");
                } else if (type === "HANA") {
                    setHanaHost(data.details?.host || "");
                    setHanaPort(data.details?.port || "");
                    setHanaUsername(data.details?.user || ""); // 'username' olmalı, 'user' değil
                    setHanaPassword(data.details?.password || "");
                    setHanaSchema(data.details?.schema || "");
                }
            } else {
                // Eğer 'data' yoksa (yani Yeni ekleme modundaysak), formu temizle.
                clearForm();
            }
        }

        if (!open) {
            // Popup kapanınca state'leri sıfırla (bu kısım doğru)
            setTesting(false);
            setSaving(false);
            setTestResult(null);
        }
    }, [open, data, type]); // 'fromDetails' artık ana mantık için bağımlılık değil

    // Validation functions
    const validateSAP = () =>
        sourceName.trim() &&
        sapHost.trim() &&
        sapInstance.trim() &&
        sapSysnr.trim() &&
        sapUser.trim();

    const validateMSSQL = () =>
        sourceName.trim() &&
        mssqlHost.trim() &&
        mssqlPort.trim() &&
        mssqlDatabase.trim() &&
        mssqlUsername.trim();

    const validateHANA = () =>
        sourceName.trim() &&
        hanaHost.trim() &&
        hanaPort.trim() &&
        hanaUsername.trim();

    // Test connection handler
    const handleTestConnection = async () => {
        // Validasyon
        if (type === "SAP" && !validateSAP()) {
            setSnackbar({ open: true, severity: "warning", message: "SAP alanlarını doldurun." });
            return;
        }
        if (type === "HANA" && !validateHANA()) {
            setSnackbar({ open: true, severity: "warning", message: "HANA alanlarını doldurun." });
            return;
        }
        if (type === "MSSQL" && !validateMSSQL()) {
            setSnackbar({ open: true, severity: "warning", message: "MSSQL alanlarını doldurun." });
            return;
        }

        setTesting(true);
        setTestResult(null);

        // details objesini form alanlarından oluştur (server'ın beklediği format)
        const details =
            type === "SAP"
                ? { user: sapUser, password: sapPassword, host: sapHost, sysnr: sapSysnr }
                : type === "HANA"
                    ? { host: hanaHost, port: hanaPort, user: hanaUsername, password: hanaPassword }
                    : { host: mssqlHost, database: mssqlDatabase, user: mssqlUsername, password: mssqlPassword };

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setSnackbar({ open: true, severity: "error", message: "Giriş token'ı bulunamadı." });
                setTesting(false);
                return;
            }

            const response = await fetch('/api/sources/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ details, type }),
            });

            const text = await response.text();
            let result = {};
            try {
                result = text ? JSON.parse(text) : {};
            } catch {
                console.warn('Test connection: parse error, raw text:', text);
                result = {};
            }

            if (response.ok) {
                setTestResult({ success: true, message: result.message || 'Connection test successful' });
                setSnackbar({ open: true, severity: 'success', message: result.message || 'Connection test successful' });
            } else {
                setTestResult({ success: false, message: result.message || 'Connection test failed' });
                setSnackbar({ open: true, severity: 'error', message: result.message || 'Connection test failed' });
            }
        } catch (err) {
            console.error('Test connection error (frontend):', err);
            setSnackbar({ open: true, severity: 'error', message: 'Connection error during testing' });
        } finally {
            setTesting(false);
        }
    };

    // Schema listesini getir
    const fetchSchemas = async (details, type) => {
        setLoadingSchemas(true);
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch('/api/sources/schemas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ details, type }),
            });

            if (response.ok) {
                const data = await response.json();
                setSchemas(data.schemas || []);
            } else {
                console.error('Schema fetch failed');
                setSnackbar({ open: true, severity: 'error', message: 'Schema fetch failed' });
            }
        } catch (err) {
            console.error('Schema fetch error:', err);
            setSnackbar({ open: true, severity: 'error', message: 'Schema fetch error' });
        } finally {
            setLoadingSchemas(false);
        }
    };

    // Table listesini getir
    const fetchTables = async (schema) => {
        if (!schema) return;

        setLoadingTables(true);
        const details = type === "SAP"
            ? { user: sapUser, password: sapPassword, host: sapHost, sysnr: sapSysnr }
            : type === "HANA"
                ? { host: hanaHost, port: hanaPort, user: hanaUsername, password: hanaPassword }
                : { host: mssqlHost, database: mssqlDatabase, user: mssqlUsername, password: mssqlPassword };

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch('/api/sources/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ details, type, schema }),
            });

            if (response.ok) {
                const data = await response.json();
                setTables(data.tables || []);
            } else {
                console.error('Table fetch failed');
                setSnackbar({ open: true, severity: 'error', message: 'Table fetch failed' });
            }
        } catch (err) {
            console.error('Table fetch error:', err);
            setSnackbar({ open: true, severity: 'error', message: 'Table fetch error' });
        } finally {
            setLoadingTables(false);
        }
    };

    // Column listesini getir
    const fetchColumns = async (schema, table) => {
        if (!schema || !table) return;

        setLoadingColumns(true);
        const details = type === "SAP"
            ? { user: sapUser, password: sapPassword, host: sapHost, sysnr: sapSysnr }
            : type === "HANA"
                ? { host: hanaHost, port: hanaPort, user: hanaUsername, password: hanaPassword }
                : { host: mssqlHost, database: mssqlDatabase, user: mssqlUsername, password: mssqlPassword };

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch('/api/sources/columns', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ details, type, schema, table }),
            });

            if (response.ok) {
                const data = await response.json();
                setColumns(data.columns || []);
                setSelectedColumns({}); // Reset column selections
            } else {
                console.error('Column fetch failed');
                setSnackbar({ open: true, severity: 'error', message: 'Column fetch failed' });
            }
        } catch (err) {
            console.error('Column fetch error:', err);
            setSnackbar({ open: true, severity: 'error', message: 'Column fetch error' });
        } finally {
            setLoadingColumns(false);
        }
    };

    // Schema seçildiğinde table listesini getir
    const handleSchemaChange = (schemaName) => {
        setSelectedSchema(schemaName);
        setSelectedTable("");
        setTables([]);
        setColumns([]);
        setSelectedColumns({});
        if (schemaName) {
            fetchTables(schemaName);
        }
    };

    // Table seçildiğinde column listesini getir
    const handleTableChange = (tableName) => {
        setSelectedTable(tableName);
        setColumns([]);
        setSelectedColumns({});
        if (tableName && selectedSchema) {
            fetchColumns(selectedSchema, tableName);
        }
    };

    // Column seçimi toggle
    const handleColumnToggle = (columnName) => {
        setSelectedColumns(prev => ({
            ...prev,
            [columnName]: !prev[columnName]
        }));
    };

    // Save handler
    const handleSave = async () => {
        const trimmedSourceName = sourceName.trim(); // Boşlukları temizle

        if (!trimmedSourceName) {
            setSnackbar({ open: true, severity: "warning", message: "Name is required" });
            return;
        }

        // --- YENİ KONTROL BAŞLANGICI ---
        if (existingSources && existingSources.length > 0) {
            // Düzenleme modunda, mevcut kaydın kendi adıyla kaydedilmesine izin ver
            // Ama başka bir kaydın adıyla aynı olamaz
            const isDuplicate = existingSources.some(
                source =>
                    source.name.toLowerCase() === trimmedSourceName.toLowerCase() &&
                    String(source.id) !== String(data?.id)
            );

            if (isDuplicate) {
                setSnackbar({ open: true, severity: "error", message: ` A source named "${trimmedSourceName}" already exists.` });
                return; // Kaydetme işlemini durdur
            }
        }
        // --- YENİ KONTROL SONU ---
        if (!sourceName.trim()) {
            setSnackbar({ open: true, severity: "warning", message: "Name is required" });
            return;
        }

        const details =
            type === "SAP"
                ? { host: sapHost, sysnr: sapSysnr, user: sapUser, password: sapPassword, instance: sapInstance, language: sapLanguage }
                : type === "HANA"
                    ? { host: hanaHost, port: hanaPort, user: hanaUsername, schema: hanaSchema, password: hanaPassword }
                    : { host: mssqlHost, ip: mssqlIp, port: mssqlPort, database: mssqlDatabase, user: mssqlUsername, password: mssqlPassword };

        const payload = { name: sourceName, type: type.toUpperCase(), details };

        setSaving(true);

        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                setSnackbar({ open: true, severity: "error", message: "Login token not found" });
                setSaving(false);
                return;
            }

            const method = data?.id ? "PUT" : "POST";
            const baseUrl = page === "sources" ? "/api/sources" : "/api/destination";
            const url = data?.id ? `${baseUrl}/${data.id}` : baseUrl;

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const text = await response.text();
            let result = {};
            try {
                result = text ? JSON.parse(text) : {};
            } catch {
                console.warn('Save: JSON parse failed, raw response:', text);
                result = {};
            }

            if (response.ok) {
                // Mesajı `page` prop'una göre dinamik olarak oluştur
                const entityName = page === 'sources' ? 'Source' : 'Destination';
                const actionMessage = data?.id ? 'updated successfully' : 'added successfully';
                const successMessage = `${entityName} ${actionMessage}.`;

                setSnackbar({ open: true, severity: "success", message: successMessage });

                if (typeof onSave === "function") {
                    const selectedColumnsArray = Object.keys(selectedColumns).filter(key => selectedColumns[key]);
                    onSave({
                        ...details,
                        type,
                        name: sourceName,
                        id: data?.id || result.sourceId,
                        selectedSchema,
                        selectedTable,
                        selectedColumns: selectedColumnsArray
                    });
                }
                setOpen(false);

                // Clear form
                clearForm();
            } else {
                setSnackbar({ open: true, severity: "error", message: result.message || "Save failed" });
                console.error('Save failed, status:', response.status, 'body:', result);
            }
        } catch (err) {
            console.error("Save error (frontend):", err);
            setSnackbar({ open: true, severity: "error", message: "Connection error" });
        } finally {
            setSaving(false);
        }
    };

    const clearForm = () => {
        setSourceName("");
        setSapHost(""); setSapInstance(""); setSapSysnr(""); setSapLanguage(""); setSapUser(""); setSapPassword("");
        setHanaHost(""); setHanaPort(""); setHanaUsername(""); setHanaPassword(""); setHanaSchema("");
        setMssqlHost(""); setMssqlIp(""); setMssqlPort(""); setMssqlDatabase(""); setMssqlUsername(""); setMssqlPassword("");
    };

    const handleCancel = () => {
        setOpen(false);
        clearForm();
    };

    const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }));

    const boxBorderStyle = {
        border: "2px solid rgba(35, 92, 156, 0.9)",
        borderRadius: 2,
        p: 2,
        mb: 2,
        backgroundColor: "#fff",
    };

    const bigButtonSx = {
        minWidth: 150,
        height: 44,
        borderRadius: "10px",
        boxShadow: "none",
        textTransform: "none",
        fontSize: 15,
        fontWeight: 500,
    };

    const primaryBlue = "#2f67b3";

    return (
        <>
            <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth PaperProps={{ sx: { mx: 2, mt: 1, p: 3, borderRadius: 3, boxShadow: 3 } }}>
                {/* Başlık */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                        {page === "sources" ? "Source" : "Destination"} ({data?.id ? "Edit" : "New"} {type})
                    </Typography>
                    <IconButton onClick={handleCancel} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Name */}
                <Box sx={{ ...boxBorderStyle }}>
                    <Typography sx={{ mb: 1, fontWeight: 500 }}>Name:</Typography>
                    <TextField fullWidth size="small" value={sourceName} disabled={fromDetails} onChange={(e) => setSourceName(e.target.value)} />
                </Box>

                {/* SAP / HANA / MSSQL Formları */}
                {type === "SAP" ? (
                    <>
                        <Typography sx={{ mb: 1, fontWeight: 600 }}>System</Typography>
                        <Box sx={{ ...boxBorderStyle }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography>Host:</Typography>
                                    <TextField fullWidth size="small" value={sapHost} disabled={fromDetails} onChange={(e) => setSapHost(e.target.value)} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography>Instance:</Typography>
                                    <TextField fullWidth size="small" value={sapInstance} disabled={fromDetails} onChange={(e) => setSapInstance(e.target.value)} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>Sysnr:</Typography>
                                    <TextField fullWidth size="small" value={sapSysnr} disabled={fromDetails} onChange={(e) => setSapSysnr(e.target.value)} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>Language:</Typography>
                                    <TextField
                                        select                 // TextField’i combobox gibi yapar
                                        fullWidth
                                        size="small"
                                        disabled={fromDetails}
                                        value={sapLanguage}    // seçili değer state’den gelir
                                        onChange={(e) => setSapLanguage(e.target.value)} // seçilen değeri state’e yaz
                                    >
                                        <MenuItem value="EN">English</MenuItem>
                                        <MenuItem value="TR">Turkish</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Box>
                        <Typography sx={{ mb: 1, fontWeight: 600 }}>Authentication</Typography>
                        <Box sx={{ ...boxBorderStyle }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography>User:</Typography>
                                    <TextField fullWidth size="small" value={sapUser} disabled={fromDetails} onChange={(e) => setSapUser(e.target.value)} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>Password:</Typography>
                                    <TextField type="password" fullWidth size="small" value={sapPassword} disabled={fromDetails} onChange={(e) => setSapPassword(e.target.value)} />
                                </Grid>
                            </Grid>
                        </Box>
                    </>
                ) : type === "HANA" ? (
                    <>
                        <Typography sx={{ mb: 1, fontWeight: 600 }}>System</Typography>
                        <Box sx={{ ...boxBorderStyle }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography>Host:</Typography>
                                    <TextField fullWidth size="small" disabled={fromDetails} value={hanaHost} onChange={(e) => setHanaHost(e.target.value)} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography>Port:</Typography>
                                    <TextField fullWidth size="small" value={hanaPort} disabled={fromDetails} onChange={(e) => setHanaPort(e.target.value)} />
                                </Grid>
                            </Grid>
                        </Box>
                        <Typography sx={{ mb: 1, fontWeight: 600 }}>Authentication</Typography>
                        <Box sx={{ ...boxBorderStyle }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography>Username:</Typography>
                                    <TextField fullWidth size="small" value={hanaUsername} disabled={fromDetails} onChange={(e) => setHanaUsername(e.target.value)} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>Password:</Typography>
                                    <TextField type="password" fullWidth size="small" value={hanaPassword} disabled={fromDetails} onChange={(e) => setHanaPassword(e.target.value)} />
                                </Grid>
                            </Grid>
                        </Box>
                    </>
                ) : (
                    // MSSQL
                    <>
                        <Typography sx={{ mb: 1, fontWeight: 600 }}>System</Typography>
                        <Box sx={{ ...boxBorderStyle }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography>Host:</Typography>
                                    <TextField fullWidth size="small" value={mssqlHost} disabled={fromDetails} onChange={(e) => setMssqlHost(e.target.value)} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography>IP:</Typography>
                                    <TextField fullWidth size="small" value={mssqlIp} disabled={fromDetails} onChange={(e) => setMssqlIp(e.target.value)} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>Port:</Typography>
                                    <TextField fullWidth size="small" value={mssqlPort} disabled={fromDetails} onChange={(e) => setMssqlPort(e.target.value)} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>Database:</Typography>
                                    <TextField fullWidth size="small" value={mssqlDatabase} disabled={fromDetails} onChange={(e) => setMssqlDatabase(e.target.value)} />
                                </Grid>
                            </Grid>
                        </Box>

                        <Typography sx={{ mb: 1, fontWeight: 600 }}>Authentication</Typography>
                        <Box sx={{ ...boxBorderStyle }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography>Username:</Typography>
                                    <TextField fullWidth size="small" value={mssqlUsername} disabled={fromDetails} onChange={(e) => setMssqlUsername(e.target.value)} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>Password:</Typography>
                                    <TextField type="password" fullWidth size="small" value={mssqlPassword} disabled={fromDetails} onChange={(e) => setMssqlPassword(e.target.value)} />
                                </Grid>
                            </Grid>
                        </Box>
                    </>
                )}

                {/* Butonlar */}
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                    <Button variant="contained" onClick={handleTestConnection} disabled={testing || saving} sx={{ ...bigButtonSx, backgroundColor: primaryBlue }}>
                        {testing ? <CircularProgress size={20} color="inherit" /> : "Test Connection"}
                    </Button>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <Button variant="contained" onClick={handleSave} disabled={saving || fromDetails || !testResult?.success} sx={{ ...bigButtonSx, backgroundColor: primaryBlue }}>
                            {saving ? <CircularProgress size={18} color="inherit" /> : "Save"}
                        </Button>
                        <Button variant="contained" onClick={handleCancel} disabled={saving || testing} sx={{ ...bigButtonSx, backgroundColor: primaryBlue }}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
