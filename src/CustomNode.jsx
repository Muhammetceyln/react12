import { Handle, Position } from 'reactflow';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import { Cloud, QueryStats, TableChart, Folder, Input, Output } from '@mui/icons-material';

// --- Logo importları ve map'leri ---
import mssqlLogo from './photo/mssqllogo.png';
import saphanaLogo from './photo/saphana.png';
import sapLogo from './photo/sapicon.png';

const logoMap = {
  MSSQL: mssqlLogo,
  HANA: saphanaLogo,
  SAP: sapLogo,
};

// --- SAP Fiori Benzeri Stil Tanımlamaları ---
const nodeStyles = {
  bapi: { icon: <Cloud sx={{ color: '#007bff' }} />, headerColor: 'rgba(0, 123, 255, 0.1)' },
  query: { icon: <QueryStats sx={{ color: '#28a745' }} />, headerColor: 'rgba(40, 167, 69, 0.1)' },
  tableSource: { icon: <TableChart sx={{ color: '#ffc107' }} />, headerColor: 'rgba(255, 193, 7, 0.1)' },
  file: { icon: <Folder sx={{ color: '#dc3545' }} />, headerColor: 'rgba(220, 53, 69, 0.1)' },
  tableDestination: { icon: <TableChart sx={{ color: '#6c757d' }} />, headerColor: 'rgba(108, 117, 125, 0.1)' },
  default: { icon: <Output sx={{ color: '#343a40' }} />, headerColor: 'rgba(52, 58, 64, 0.1)' },
  input: { icon: <Input sx={{ color: '#17a2b8' }} />, headerColor: 'rgba(23, 162, 184, 0.1)' },
  output: { icon: <Output sx={{ color: '#6c757d' }} />, headerColor: 'rgba(108, 117, 125, 0.1)' },
};

const nodeRoles = {
  source: ['bapi', 'query', 'tableSource', 'input'],
  destination: ['file', 'tableDestination', 'output'],
  transform: ['default'],
};

const getDisplayType = (type) => {
  if (type.toLowerCase().includes('source')) return 'Source';
  if (type.toLowerCase().includes('destination')) return 'Destination';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// --- Handle Stilleri (Daha İnce ve Modern) ---
const handleStyle = {
  width: 10,
  height: 10,
  background: '#ffffff',
  border: '2px solid #007bff',
  borderRadius: '50%',
  zIndex: 11,
};

const CustomNode = ({ data, type }) => {
  const baseStyle = nodeStyles[type] || nodeStyles.default;
  const executionStatus = data.executionStatus;

  // --- Dinamik Stil ve Durum Yönetimi ---
  const getExecutionStyle = () => {
    switch (executionStatus) {
      case 'waiting':
        return { borderColor: '#6c757d', opacity: 0.6, boxShadow: 'none' };
      case 'processing':
        return { borderColor: '#ffc107', opacity: 1, boxShadow: '0 0 12px rgba(255, 193, 7, 0.6)' };
      case 'completed':
        return { borderColor: '#28a745', opacity: 1, boxShadow: '0 0 12px rgba(40, 167, 69, 0.4)' };
      case 'error':
        return { borderColor: '#dc3545', opacity: 1, boxShadow: '0 0 12px rgba(220, 53, 69, 0.5)' };
      default:
        return { borderColor: '#ced4da', opacity: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
    }
  };

  const style = getExecutionStyle();

  const isSource = nodeRoles.source.includes(type);
  const isDestination = nodeRoles.destination.includes(type);
  const isTransform = nodeRoles.transform.includes(type);

  const nodeLabel = (data.customName && data.customName.trim() !== '') ? data.customName : '(İsim vermek için çift tıkla)';

  const connectionLabel = data.connectionName
    ? `${data.connectionType} (${data.connectionName})`
    : data.connectionType;

  // --- SAP Fiori Tarzı Kart Yapısı ---
  return (
    <Box sx={{
      backgroundColor: '#ffffff',
      border: `2px solid ${style.borderColor}`,
      borderRadius: '4px', // Daha keskin köşeler
      minWidth: 200,
      maxWidth: 220,
      boxShadow: style.boxShadow,
      opacity: style.opacity,
      position: 'relative',
      transition: 'all 0.3s ease',
      fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif', // Kurumsal font
    }}>
      {/* --- Sıra Numarası Rozeti --- */}
      {data.creationIndex && (
        <Box sx={{
          position: 'absolute',
          top: -10,
          left: -10,
          background: '#007bff',
          color: 'white',
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          border: '2px solid white',
          zIndex: 12,
        }}>
          {data.creationIndex}
        </Box>
      )}

      {/* --- BAŞLIK (HEADER) --- */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: `1px solid ${style.borderColor}`,
        backgroundColor: baseStyle.headerColor,
      }}>
        {baseStyle.icon}
        <Typography
          variant="body2"
          sx={{
            ml: 1.5,
            fontWeight: 600, // Daha belirgin
            color: '#343a40',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {nodeLabel}
        </Typography>
      </Box>

      {/* --- GÖVDE (BODY) --- */}
      <Box sx={{
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120, // Sabit yükseklik
      }}>
        <Box sx={{
          width: 64, // Daha küçük logo
          height: 64,
          mb: 1,
        }}>
          {logoMap[data.connectionType] && (
            <img
              src={logoMap[data.connectionType]}
              alt={data.connectionType}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 500, textAlign: 'center' }}>
          {getDisplayType(type)}
        </Typography>
        <Typography variant="caption" sx={{ color: '#495057', fontWeight: 600, textAlign: 'center' }}>
          {connectionLabel}
        </Typography>
      </Box>

      {/* --- HANDLES (Giriş/Çıkış Noktaları) --- */}
      {(isDestination || isTransform) && (
        <Handle
          type="target"
          position={Position.Top}
          style={handleStyle}
        />
      )}
      {(isSource || isTransform) && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={handleStyle}
        />
      )}
    </Box>
  );
};

export default memo(CustomNode);
