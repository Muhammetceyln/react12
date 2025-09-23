-- JOBS tablosunu oluştur - SAP Job Scheduler için

-- JOBS ana tablosu
CREATE TABLE [mosuser].[JOBS] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    USER_ID INT NOT NULL,
    NAME NVARCHAR(100) NOT NULL,
    DESCRIPTION NVARCHAR(500) NULL,
    PATTERN NVARCHAR(50) NOT NULL, -- Cron expression (ör: '0 */5 * * *')
    ENABLED BIT DEFAULT 0,
    TEMPLATE_ID INT NULL, -- TEMPLATES tablosuna referans
    STATUS NVARCHAR(20) DEFAULT 'Stopped', -- 'Running', 'Stopped', 'Error'
    CREATED_AT DATETIME DEFAULT GETDATE(),
    LAST_RUN_AT DATETIME NULL,
    NEXT_RUN_AT DATETIME NULL,
    
    -- Foreign key constraints
    CONSTRAINT FK_JOBS_USER_ID FOREIGN KEY (USER_ID) REFERENCES [mosuser].[Users](ID),
    CONSTRAINT FK_JOBS_TEMPLATE_ID FOREIGN KEY (TEMPLATE_ID) REFERENCES [mosuser].[TEMPLATES](ID)
);

-- JOB_LOGS tablosu - Job çalıştırma geçmişi için
CREATE TABLE [mosuser].[JOB_LOGS] (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    JOB_ID INT NOT NULL,
    RUN_AT DATETIME DEFAULT GETDATE(),
    STATUS NVARCHAR(20) NOT NULL, -- 'Success', 'Error', 'Running'
    MESSAGE NVARCHAR(MAX) NULL,
    DURATION_MS INT NULL,
    
    CONSTRAINT FK_JOB_LOGS_JOB_ID FOREIGN KEY (JOB_ID) REFERENCES [mosuser].[JOBS](ID) ON DELETE CASCADE
);

-- Index'ler
CREATE INDEX IX_JOBS_USER_ID ON [mosuser].[JOBS](USER_ID);
CREATE INDEX IX_JOBS_ENABLED ON [mosuser].[JOBS](ENABLED);
CREATE INDEX IX_JOBS_STATUS ON [mosuser].[JOBS](STATUS);
CREATE INDEX IX_JOB_LOGS_JOB_ID ON [mosuser].[JOB_LOGS](JOB_ID);
CREATE INDEX IX_JOB_LOGS_RUN_AT ON [mosuser].[JOB_LOGS](RUN_AT);

-- Test verileri ekle
INSERT INTO [mosuser].[JOBS] (USER_ID, NAME, DESCRIPTION, PATTERN, ENABLED, STATUS) VALUES
(1, 'Daily Data Sync', 'Günlük veri senkronizasyonu', '0 9 * * *', 1, 'Stopped'),
(1, 'Hourly Report', 'Saatlik rapor oluşturma', '0 */1 * * *', 0, 'Stopped'),
(1, 'Weekly Cleanup', 'Haftalık temizlik işlemi', '0 2 * * 0', 0, 'Stopped');

-- Kontrol sorguları
SELECT 'JOBS Tablosu' as INFO, COUNT(*) as KAYIT_SAYISI FROM [mosuser].[JOBS];

SELECT * FROM [mosuser].[JOBS] ORDER BY CREATED_AT DESC;

-- Tablo yapısını kontrol et
SELECT 
    COLUMN_NAME,
    CASE 
        WHEN DATA_TYPE IN ('varchar', 'nvarchar', 'char', 'nchar') 
        THEN DATA_TYPE + '(' + CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR) + ')'
        WHEN DATA_TYPE IN ('decimal', 'numeric') 
        THEN DATA_TYPE + '(' + CAST(NUMERIC_PRECISION AS VARCHAR) + ',' + CAST(NUMERIC_SCALE AS VARCHAR) + ')'
        ELSE DATA_TYPE
    END AS FULL_DATA_TYPE,
    CASE WHEN IS_NULLABLE = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mosuser' AND TABLE_NAME = 'JOBS'
ORDER BY ORDINAL_POSITION;
