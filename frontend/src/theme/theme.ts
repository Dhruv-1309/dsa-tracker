import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F3FF0',
      light: '#7265F3',
      dark: '#3A2EB8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0E9F6E',
      light: '#31C48D',
      dark: '#04744E',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F6FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#171A2B',
      secondary: '#64748B',
    },
    divider: '#E3E6EF',
    error: {
      main: '#DC2626',
      light: '#FDECEC',
    },
    warning: {
      main: '#D97706',
      light: '#FEF3C7',
    },
    success: {
      main: '#0E9F6E',
      light: '#DEF7EC',
    },
    info: {
      main: '#3B82F6',
      light: '#EFF6FF',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#64748B',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: '#64748B',
    },
    button: {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F6FA',
          color: '#171A2B',
          fontFamily: '"IBM Plex Sans", sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79, 63, 240, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #4F3FF0 0%, #6355F5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3A2EB8 0%, #4F3FF0 100%)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 14,
          border: '1px solid #E3E6EF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.02)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
        elevation2: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            '& fieldset': {
              borderColor: '#E3E6EF',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: '#C7CCE3',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4F3FF0',
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#F8FAFC',
          color: '#475569',
          fontWeight: 600,
          borderBottom: '1px solid #E3E6EF',
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        body: {
          borderBottom: '1px solid #F1F5F9',
        },
      },
    },
  },
});
