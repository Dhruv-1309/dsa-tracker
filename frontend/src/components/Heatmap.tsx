import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../api/useApiClient';
import type { HeatmapEntry } from '../types/stats';
import {
  Paper,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Stack,
  Tooltip,
} from '@mui/material';

function generateHeatmapGrid(year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const grid: (Date | null)[][] = [];
  let currentDate = new Date(startDate);

  // Rewind to Sunday of the first week
  while (currentDate.getDay() !== 0) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (currentDate <= endDate || currentDate.getDay() !== 0) {
    if (currentDate > endDate && currentDate.getDay() === 0) {
      break;
    }

    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (currentDate.getFullYear() === year) {
        week.push(new Date(currentDate));
      } else {
        week.push(null);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Heatmap() {
  const fetchApi = useApiClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: entries = [], isLoading } = useQuery<HeatmapEntry[]>({
    queryKey: ['heatmap', year],
    queryFn: async () => {
      const res = await fetchApi(`/stats/heatmap?year=${year}`);
      if (!res.ok) throw new Error('Failed to fetch heatmap');
      return res.json();
    },
  });

  const entryMap = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      map.set(e.date, e.count);
    });
    return map;
  }, [entries]);

  const grid = useMemo(() => generateHeatmapGrid(year), [year]);

  const getColor = (count: number) => {
    if (count === 0) return '#E2E4EC';
    if (count === 1) return '#C7CCE3';
    if (count <= 3) return '#8B7FF5';
    if (count <= 5) return '#4F3FF0';
    return '#10B981';
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E3E6EF' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
            Activity & Habit Heatmap
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Daily practice sessions and spaced repetitions logged in {year}.
          </Typography>
        </div>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            sx={{
              borderRadius: 2,
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {[currentYear - 2, currentYear - 1, currentYear].map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={32} sx={{ color: '#4F3FF0', mb: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            Loading activity data...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto', pb: 2 }}>
          <Box sx={{ minWidth: 780, position: 'relative' }}>
            {/* Months Header */}
            <Box sx={{ display: 'flex', ml: 4, mb: 1, position: 'relative', height: 20 }}>
              {grid.map((week, index) => {
                const firstDay = week.find((d) => d !== null);
                if (firstDay && firstDay.getDate() <= 7 && index > 0) {
                  const prevWeekFirstDay = grid[index - 1].find((d) => d !== null);
                  if (prevWeekFirstDay && prevWeekFirstDay.getMonth() !== firstDay.getMonth()) {
                    return (
                      <Typography
                        key={index}
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          left: `${(index / grid.length) * 100}%`,
                          fontFamily: '"IBM Plex Mono", monospace',
                          color: '#64748B',
                          fontSize: '0.75rem',
                        }}
                      >
                        {MONTHS[firstDay.getMonth()]}
                      </Typography>
                    );
                  }
                }
                return null;
              })}
            </Box>

            {/* Grid Days */}
            <Box sx={{ display: 'flex', gap: '3px' }}>
              {/* Day Labels */}
              <Stack
                spacing={0.5}
                sx={{
                  width: 28,
                  pr: 1,
                  justifyContent: 'space-between',
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.65rem',
                  color: '#94A3B8',
                }}
              >
                <span style={{ height: 11 }}></span>
                <span style={{ height: 11 }}>Mon</span>
                <span style={{ height: 11 }}></span>
                <span style={{ height: 11 }}>Wed</span>
                <span style={{ height: 11 }}></span>
                <span style={{ height: 11 }}>Fri</span>
                <span style={{ height: 11 }}></span>
              </Stack>

              {/* Columns */}
              {grid.map((week, weekIdx) => (
                <Stack key={weekIdx} spacing="3px" sx={{ flex: 1 }}>
                  {week.map((day, dayIdx) => {
                    if (!day) {
                      return <Box key={dayIdx} sx={{ width: '100%', pt: '100%', borderRadius: '2px' }} />;
                    }
                    const dateStr = formatDate(day);
                    const count = entryMap.get(dateStr) || 0;
                    return (
                      <Tooltip
                        key={dayIdx}
                        title={`${count} attempt${count === 1 ? '' : 's'} on ${dateStr}`}
                        arrow
                      >
                        <Box
                          sx={{
                            width: '100%',
                            pt: '100%',
                            borderRadius: '3px',
                            backgroundColor: getColor(count),
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                            '&:hover': {
                              transform: 'scale(1.25)',
                              zIndex: 2,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Stack>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Legend Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 2 }}>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
          Less
        </Typography>
        <Stack direction="row" spacing="3px">
          {[0, 1, 3, 5, 6].map((level) => (
            <Box
              key={level}
              sx={{
                width: 12,
                height: 12,
                borderRadius: '2px',
                backgroundColor: getColor(level),
              }}
            />
          ))}
        </Stack>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
          More
        </Typography>
      </Box>
    </Paper>
  );
}
