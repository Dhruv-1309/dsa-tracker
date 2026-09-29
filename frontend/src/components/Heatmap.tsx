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

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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

const LEGEND_ITEMS = [
  { level: 0, label: '0 attempts (no activity)', color: '#E2E4EC' },
  { level: 1, label: '1 attempt', color: '#C7CCE3' },
  { level: 3, label: '2–3 attempts', color: '#8B7FF5' },
  { level: 5, label: '4–5 attempts', color: '#4F3FF0' },
  { level: 6, label: '6+ attempts (optimal/peak)', color: '#10B981' },
];

interface HeatmapProps {
  data?: HeatmapEntry[];
  readOnly?: boolean;
}

export default function Heatmap({ data, readOnly }: HeatmapProps = {}) {
  const fetchApi = useApiClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: fetchedEntries = [], isLoading: isQueryLoading } = useQuery<HeatmapEntry[]>({
    queryKey: ['heatmap', year],
    queryFn: async () => {
      const res = await fetchApi(`/stats/heatmap?year=${year}`);
      if (!res.ok) throw new Error('Failed to fetch heatmap');
      return res.json();
    },
    enabled: !data,
  });

  const entries = data ?? fetchedEntries;
  const isLoading = !data && isQueryLoading;

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
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E3E6EF' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}
          >
            Activity & Habit Heatmap
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Daily practice sessions and spaced repetitions logged in {year}.
          </Typography>
        </div>

        {!readOnly && (
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              IconComponent={KeyboardArrowDownIcon}
              inputProps={{ 'aria-label': 'Select activity year' }}
              sx={{
                borderRadius: 1.5,
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 600,
                fontSize: '0.85rem',
                backgroundColor: '#FFFFFF',
                '& .MuiSelect-select': {
                  py: 0.8,
                  pr: 4,
                },
                '& .MuiSelect-icon': {
                  color: '#4F3FF0',
                },
              }}
            >
              {[currentYear - 2, currentYear - 1, currentYear].map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
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
            {/* Months Header — Aligned directly to week columns */}
            <Box sx={{ display: 'flex', gap: '3px', mb: 1, height: 18, alignItems: 'center' }}>
              {/* Day labels offset spacer */}
              <Box sx={{ width: 28, pr: 1, flexShrink: 0 }} />

              {/* Week columns header */}
              {grid.map((week, weekIdx) => {
                const firstValidDay = week.find((d) => d !== null);
                const prevWeekFirstDay = weekIdx > 0 ? grid[weekIdx - 1]?.find((d) => d !== null) : null;
                const isNewMonth =
                  firstValidDay &&
                  (weekIdx === 0 ||
                    (prevWeekFirstDay && prevWeekFirstDay.getMonth() !== firstValidDay.getMonth()));

                return (
                  <Box key={weekIdx} sx={{ flex: 1, position: 'relative' }}>
                    {isNewMonth && (
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          fontFamily: '"IBM Plex Mono", monospace',
                          color: '#64748B',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {MONTHS[firstValidDay.getMonth()]}
                      </Typography>
                    )}
                  </Box>
                );
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

      {/* Legend Footer with Accessible Labels & Tooltips */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1.5,
          mt: 2,
          flexWrap: 'wrap',
        }}
        role="group"
        aria-label="Activity heatmap color legend"
      >
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
          Less
        </Typography>
        <Stack direction="row" spacing="4px" sx={{ alignItems: 'center' }}>
          {LEGEND_ITEMS.map(({ level, label, color }) => (
            <Tooltip key={level} title={label} arrow>
              <Box
                component="span"
                role="img"
                aria-label={label}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '2px',
                  backgroundColor: color,
                  cursor: 'pointer',
                  display: 'inline-block',
                }}
              />
            </Tooltip>
          ))}
        </Stack>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
          More
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#10B981',
            fontSize: '0.72rem',
            fontWeight: 600,
            ml: 1,
            backgroundColor: '#DEF7EC',
            px: 1,
            py: 0.25,
            borderRadius: 1,
          }}
        >
          Green = 6+ optimal solves
        </Typography>
      </Box>
    </Paper>
  );
}
