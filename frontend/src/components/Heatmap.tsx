import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../api/useApiClient';
import type { HeatmapEntry } from '../types/stats';
import { formatDate as formatFriendlyDate } from '../utils/dateUtils';
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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const LEGEND_ITEMS = [
  { level: 0, label: '0 attempts (no activity)', color: '#E2E4EC' },
  { level: 1, label: '1 attempt', color: '#C7CCE3' },
  { level: 3, label: '2–3 attempts', color: '#8B7FF5' },
  { level: 5, label: '4–5 attempts', color: '#4F3FF0' },
  { level: 6, label: '6+ attempts (optimal/peak)', color: '#10B981' },
];

function getColor(count: number) {
  if (count === 0) return '#E2E4EC';
  if (count === 1) return '#C7CCE3';
  if (count <= 3) return '#8B7FF5';
  if (count <= 5) return '#4F3FF0';
  return '#10B981';
}

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface DayCell {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  count: number;
  isToday: boolean;
}

interface MonthData {
  monthIndex: number;
  name: string;
  calendarWeeks: (DayCell | null)[][];
  totalAttempts: number;
}

function buildMonthData(year: number, entryMap: Map<string, number>): MonthData[] {
  const todayStr = formatDate(new Date());
  const months: MonthData[] = [];

  for (let m = 0; m < 12; m++) {
    const name = MONTH_NAMES[m];
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const days: DayCell[] = [];
    let totalAttempts = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m, d);
      const dateStr = formatDate(date);
      const count = entryMap.get(dateStr) || 0;
      totalAttempts += count;

      days.push({
        date,
        dateStr,
        dayOfMonth: d,
        count,
        isToday: dateStr === todayStr,
      });
    }

    // Calendar grid: rows are weeks, 7 columns (Sunday = 0 to Saturday = 6)
    const startDayOfWeek = new Date(year, m, 1).getDay();
    const calendarWeeks: (DayCell | null)[][] = [];
    let currentWeek: (DayCell | null)[] = [];

    // Pad blank slots before day 1
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        calendarWeeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Pad blank slots after the last day of the month
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      calendarWeeks.push(currentWeek);
    }

    months.push({
      monthIndex: m,
      name,
      calendarWeeks,
      totalAttempts,
    });
  }

  return months;
}

interface HeatmapProps {
  data?: HeatmapEntry[];
  readOnly?: boolean;
}

export default function Heatmap({ data, readOnly }: HeatmapProps = {}) {
  const fetchApi = useApiClient();
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const [year, setYear] = useState(currentYear);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeMonthRef = useRef<HTMLDivElement | null>(null);

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

  const monthDataList = useMemo(() => buildMonthData(year, entryMap), [year, entryMap]);

  // Gently scroll to the active month on initial mount if viewing the current year
  useEffect(() => {
    if (year === currentYear && activeMonthRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const target = activeMonthRef.current;
      const scrollPos = target.offsetLeft - container.offsetWidth / 2 + target.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
    }
  }, [year, currentYear]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        border: '1px solid #E3E6EF',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header bar: Title, Subtitle, and Year Selector */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <div>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, color: '#171A2B' }}
          >
            Activity & Habit Heatmap
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Daily practice sessions and spaced repetitions logged in {year}.
          </Typography>
        </div>

        {!readOnly && (
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              IconComponent={KeyboardArrowDownIcon}
              inputProps={{ 'aria-label': 'Select activity year' }}
              sx={{
                borderRadius: 2,
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

      {/* Loading state */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={32} sx={{ color: '#4F3FF0', mb: 1.5 }} />
          <Typography variant="body2" color="text.secondary">
            Loading activity data...
          </Typography>
        </Box>
      ) : (
        /* ================= MONTH-WISE DIVIDED HEATMAP ================= */
        <Box
          ref={scrollContainerRef}
          sx={{
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 2,
            pt: 0.5,
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#F1F5F9',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#CBD5E1',
              borderRadius: 3,
              '&:hover': {
                backgroundColor: '#94A3B8',
              },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 2.5, md: 3 }, // Distinct separation between every month
              alignItems: 'flex-start',
              width: 'max-content',
              py: 0.5,
              px: 0.5,
            }}
          >
            {monthDataList.map((m) => {
              const isCurrentMonth = year === currentYear && m.monthIndex === currentMonthIndex;
              return (
                <Box
                  key={m.monthIndex}
                  ref={isCurrentMonth ? activeMonthRef : null}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {/* Month Label Centered Above Its Days */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: isCurrentMonth ? 700 : 600,
                      color: isCurrentMonth ? '#4F3FF0' : '#64748B',
                      fontSize: '0.85rem',
                      mb: 1.5,
                      letterSpacing: '0.02em',
                      textAlign: 'center',
                    }}
                  >
                    {m.name}
                  </Typography>

                  {/* 7-column Calendar Grid (Sunday to Saturday) with Circular Dots */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {m.calendarWeeks.map((week, wIdx) => (
                      <Box key={wIdx} sx={{ display: 'flex', gap: '4px' }}>
                        {week.map((cell, colIdx) => {
                          if (!cell) {
                            return (
                              <Box
                                key={colIdx}
                                sx={{
                                  width: 14,
                                  height: 14,
                                  visibility: 'hidden',
                                }}
                              />
                            );
                          }

                          const friendlyDate = formatFriendlyDate(cell.date);

                          return (
                            <Tooltip
                              key={colIdx}
                              title={`${cell.count} attempt${cell.count === 1 ? '' : 's'} • ${friendlyDate}`}
                              arrow
                            >
                              <Box
                                sx={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  backgroundColor: getColor(cell.count),
                                  cursor: 'pointer',
                                  outline: cell.isToday ? '2px solid #4F3FF0' : 'none',
                                  outlineOffset: '1px',
                                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                  '&:hover': {
                                    transform: 'scale(1.35)',
                                    zIndex: 3,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                  },
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
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
          mt: 2.5,
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
                  borderRadius: '50%',
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
            px: 1.2,
            py: 0.4,
            borderRadius: 1.5,
          }}
        >
          Green = 6+ optimal solves
        </Typography>
      </Box>
    </Paper>
  );
}
