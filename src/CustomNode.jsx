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

const nodeStyles = {
  bapi: { icon: <Cloud />, backgroundColor: '#cce5ff', borderColor: '#b8daff' },
  query: { icon: <QueryStats />, backgroundColor: '#d4edda', borderColor: '#c3e6cb' },
  tableSource: { icon: <TableChart />, backgroundColor: '#fff3cd', borderColor: '#ffeeba' },
  file: { icon: <Folder />, backgroundColor: '#f8d7da', borderColor: '#f5c6cb' },
  tableDestination: { icon: <TableChart />, backgroundColor: '#e2e3e5', borderColor: '#d6d8db' },
  default: { icon: <Output />, backgroundColor: '#fefefe', borderColor: '#ddd' },
  input: { icon: <Input />, backgroundColor: '#fefefe', borderColor: '#ddd' },
  output: { icon: <Output />, backgroundColor: '#fefefe', borderColor: '#ddd' },
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

// ## YENİ: Handle stillerini burada tanımlıyoruz
const handleBaseStyle = {
  background: '#555',
  border: '2px solid white', // Düğümün kenarlığından ayırmak için
  width: 24, // Genişliği artırdık
  height: 12, // Yüksekliği yarısı kadar yaparak yarım daire temeli oluşturduk
  zIndex: 10,
};

// Hedef (üst) için stil
const targetHandleStyle = {
  ...handleBaseStyle,
  top: -7, // Yüksekliğin yarısı kadar yukarı taşıyarak düğümün dışına çıkmasını sağladık
  borderRadius: '12px 12px 0 0', // Sadece üst köşeleri yuvarladık
};

// Kaynak (alt) için stil
const sourceHandleStyle = {
  ...handleBaseStyle,
  bottom: -7, // Yüksekliğin yarısı kadar aşağı taşıdık
  borderRadius: '0 0 12px 12px', // Sadece alt köşeleri yuvarladık
};


const CustomNode = ({ data, type }) => {
  const baseStyle = nodeStyles[type] || nodeStyles.default;
  const executionStatus = data.executionStatus;

  const getExecutionStyle = () => {
    switch (executionStatus) {
      case 'waiting':
        return { backgroundColor: '#f8f9fa', borderColor: '#dee2e6', opacity: 0.7 };
      case 'processing':
        return { ...baseStyle, backgroundColor: '#fff3cd', borderColor: '#ffc107', boxShadow: '0 0 10px rgba(255,193,7,0.5)' };
      case 'completed':
        return { ...baseStyle, backgroundColor: '#d4edda', borderColor: '#28a745', boxShadow: '0 0 10px rgba(40,167,69,0.3)' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#f8d7da', borderColor: '#dc3545', boxShadow: '0 0 10px rgba(220,53,69,0.3)' };
      default:
        return baseStyle;
    }
  };

  const style = executionStatus ? getExecutionStyle() : baseStyle;

  const isSource = nodeRoles.source.includes(type);
  const isDestination = nodeRoles.destination.includes(type);
  const isTransform = nodeRoles.transform.includes(type);

  const nodeLabel = (data.customName && data.customName.trim() !== '') ? data.customName : '(İsim vermek için çift tıkla)';

  const connectionLabel = data.connectionName
    ? `${data.connectionType} (${data.connectionName})`
    : data.connectionType;

  const getStatusIcon = () => {
    switch (executionStatus) {
      case 'waiting': return '⏳';
      case 'processing': return '🟡';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return null;
    }
  };

  return (
    <Box sx={{
      backgroundColor: style.backgroundColor,
      border: `1px solid ${style.borderColor}`,
      borderRadius: '8px',
      minWidth: 180,
      maxWidth: 280,
      boxShadow: style.boxShadow || '0 12px 40px rgba(0,0,0,0.08)',
      opacity: style.opacity || 1,
      position: 'relative',
      transition: 'all 0.2s ease-in-out',
    }}>
      {/* --- BAŞLIK ALANI (HEADER) --- */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px ',
        borderBottom: `1px solid ${style.borderColor}`,
        backgroundColor: 'rgba(0,0,0,0.03)'
      }}>
        {baseStyle.icon}
        <Typography
          variant="body2"
          sx={{
            ml: 1,
            fontWeight: 'bold',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          <span style={{ color: '#555' }}>{getDisplayType(type)}:</span> {nodeLabel}
        </Typography>
      </Box>

      {/* --- GÖVDE ALANI (BODY) --- */}
      <Box sx={{
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',

      }}>
        <Box sx={{
          width: 112,
          height: 112,
          mb: 2,
        }}>
          {logoMap[data.connectionType] && (
            <img
              src={logoMap[data.connectionType]}
              alt={data.connectionType}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: '500' }}>
          {connectionLabel}
        </Typography>
      </Box>

      {/* --- Durum ikonu --- */}
      {getStatusIcon() && (
        <Typography sx={{ fontSize: '1rem', position: 'absolute', top: 5, right: 8 }}>
          {getStatusIcon()}
        </Typography>
      )}

      {/* ## GÜNCELLEME: Handle pozisyonları ve stilleri değiştirildi ## */}
      {(isDestination || isTransform) && (
        <Handle
          type="target"
          position={Position.Top} // Üste alındı
          style={targetHandleStyle} // Yeni stil uygulandı
        />
      )}
      {(isSource || isTransform) && (
        <Handle
          type="source"
          position={Position.Bottom} // Alta alındı
          style={sourceHandleStyle} // Yeni stil uygulandı
        />
      )}
    </Box>
  );
};

export default memo(CustomNode);