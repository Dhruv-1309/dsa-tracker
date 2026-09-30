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
  Chip,
  Button,
} from '@mui/material';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ViewWeekOutlinedIcon from '@mui/icons-material/ViewWeekOutlined';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
  dayOfWeek: number;
  count: number;
  isToday: boolean;
}

interface MonthData {
  monthIndex: number;
  name: string;
  shortName: string;
  days: DayCell[];
  totalAttempts: number;
  activeDays: number;
  calendarWeeks: (DayCell | null)[][];
  timelineColumns: (DayCell | null)[][];
}

function buildMonthData(year: number, entryMap: Map<string, number>): MonthData[] {
  const todayStr = formatDate(new Date());
  const months: MonthData[] = [];

  for (let m = 0; m < 12; m++) {
    const name = MONTH_NAMES[m];
    const shortName = MONTHS_SHORT[m];
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const days: DayCell[] = [];
    let totalAttempts = 0;
    let activeDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m, d);
      const dateStr = formatDate(date);
      const count = entryMap.get(dateStr) || 0;
      totalAttempts += count;
      if (count > 0) activeDays++;

      days.push({
        date,
        dateStr,
        dayOfMonth: d,
        dayOfWeek: date.getDay(),
        count,
        isToday: dateStr === todayStr,
      });
    }

    // 1. Calendar Weeks for Month Grid (Rows: weeks, Cols: Sun[0] to Sat[6])
    const startDayOfWeek = new Date(year, m, 1).getDay();
    const calendarWeeks: (DayCell | null)[][] = [];
    let currentWeek: (DayCell | null)[] = [];

    // Pad days before 1st
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

    // Pad remaining slots in last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      calendarWeeks.push(currentWeek);
    }

    // 2. Timeline Columns for Horizontal View (Cols: weeks, Rows: Sun[0] to Sat[6])
    const timelineColumns: (DayCell | null)[][] = [];
    let currentCol: (DayCell | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      currentCol.push(null);
    }

    for (const day of days) {
      currentCol.push(day);
      if (currentCol.length === 7) {
        timelineColumns.push(currentCol);
        currentCol = [];
      }
    }

    if (currentCol.length > 0) {
      while (currentCol.length < 7) {
        currentCol.push(null);
      }
      timelineColumns.push(currentCol);
    }

    months.push({
      monthIndex: m,
      name,
      shortName,
      days,
      totalAttempts,
      activeDays,
      calendarWeeks,
      timelineColumns,
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
  const [year, setYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL');

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

  // Aggregate yearly metrics
  const { totalYearAttempts, totalActiveDays, bestMonth } = useMemo<{
    totalYearAttempts: number;
    totalActiveDays: number;
    bestMonth: MonthData | null;
  }>(() => {
    let totalAttempts = 0;
    let activeDays = 0;
    let topMonth: MonthData | null = null;

    for (const m of monthDataList) {
      totalAttempts += m.totalAttempts;
      activeDays += m.activeDays;
      if (!topMonth || m.totalAttempts > topMonth.totalAttempts) {
        topMonth = m;
      }
    }

    return {
      totalYearAttempts: totalAttempts,
      totalActiveDays: activeDays,
      bestMonth: topMonth,
    };
  }, [monthDataList]);

  // Filter months if a specific month is chosen
  const displayedMonths = useMemo(() => {
    if (selectedMonth === 'ALL') return monthDataList;
    return monthDataList.filter((m) => m.monthIndex === selectedMonth);
  }, [monthDataList, selectedMonth]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: '1px solid #E3E6EF',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header bar: Title, Year Selector, Month Filter, View Switcher */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 2.5,
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
            Daily practice sessions and spaced repetitions logged in {year}, divided month-wise.
          </Typography>
        </div>

        {/* Controls Container */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1,
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
          }}
        >
          {/* View Mode Toggle: Grid (Month Cards) vs Timeline (Horizontal) */}
          <Box
            sx={{
              display: 'inline-flex',
              p: '3px',
              backgroundColor: '#F1F5F9',
              borderRadius: 2,
              border: '1px solid #E2E8F0',
            }}
            role="group"
            aria-label="Heatmap layout style"
          >
            <Button
              size="small"
              onClick={() => setViewMode('grid')}
              startIcon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                backgroundColor: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'grid' ? '#4F3FF0' : '#64748B',
                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                '&:hover': {
                  backgroundColor: viewMode === 'grid' ? '#FFFFFF' : '#E2E8F0',
                },
              }}
            >
              Month Grid
            </Button>
            <Button
              size="small"
              onClick={() => setViewMode('timeline')}
              startIcon={<ViewWeekOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                backgroundColor: viewMode === 'timeline' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'timeline' ? '#4F3FF0' : '#64748B',
                boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                '&:hover': {
                  backgroundColor: viewMode === 'timeline' ? '#FFFFFF' : '#E2E8F0',
                },
              }}
            >
              Timeline
            </Button>
          </Box>

          {/* Month Selector Filter */}
          <FormControl size="small" sx={{ minWidth: 125 }}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value as number | 'ALL')}
              IconComponent={KeyboardArrowDownIcon}
              inputProps={{ 'aria-label': 'Filter by month' }}
              sx={{
                borderRadius: 2,
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 600,
                fontSize: '0.82rem',
                backgroundColor: '#FFFFFF',
                '& .MuiSelect-select': {
                  py: 0.7,
                  pr: 4,
                },
                '& .MuiSelect-icon': {
                  color: '#4F3FF0',
                },
              }}
            >
              <MenuItem value="ALL">All Months</MenuItem>
              {MONTH_NAMES.map((name, idx) => (
                <MenuItem key={idx} value={idx}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Year Selector (Hidden on read-only friend views) */}
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
                  fontSize: '0.82rem',
                  backgroundColor: '#FFFFFF',
                  '& .MuiSelect-select': {
                    py: 0.7,
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
        </Stack>
      </Box>

      {/* Yearly Summary Stats Bar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          p: 1.5,
          borderRadius: 2,
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
            Total Solves ({year}):
          </Typography>
          <Chip
            size="small"
            label={`${totalYearAttempts} attempts`}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              fontFamily: '"IBM Plex Mono", monospace',
              backgroundColor: '#EEEBFF',
              color: '#4F3FF0',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
            Active Days:
          </Typography>
          <Chip
            size="small"
            label={`${totalActiveDays} days`}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              fontFamily: '"IBM Plex Mono", monospace',
              backgroundColor: '#ECFDF5',
              color: '#059669',
            }}
          />
        </Box>
        {bestMonth && bestMonth.totalAttempts > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
              Peak Month:
            </Typography>
            <Chip
              size="small"
              label={`${bestMonth.name} (${bestMonth.totalAttempts} attempts)`}
              sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                fontFamily: '"IBM Plex Mono", monospace',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
              }}
            />
          </Box>
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
      ) : viewMode === 'grid' ? (
        /* ================= 1. MONTH CARDS GRID VIEW ================= */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: selectedMonth !== 'ALL' ? '1fr' : 'repeat(2, 1fr)',
              md: selectedMonth !== 'ALL' ? '1fr' : 'repeat(3, 1fr)',
              lg: selectedMonth !== 'ALL' ? '1fr' : 'repeat(4, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {displayedMonths.map((m) => (
            <Paper
              key={m.monthIndex}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: '1px solid #E3E6EF',
                backgroundColor: '#FFFFFF',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                },
              }}
            >
              {/* Month Card Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                    color: '#1E293B',
                    fontSize: selectedMonth !== 'ALL' ? '1.1rem' : '0.9rem',
                  }}
                >
                  {m.name}
                </Typography>
                <Chip
                  size="small"
                  label={`${m.totalAttempts} ${m.totalAttempts === 1 ? 'attempt' : 'attempts'}`}
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    fontFamily: '"IBM Plex Mono", monospace',
                    backgroundColor: m.totalAttempts > 0 ? '#EEEBFF' : '#F1F5F9',
                    color: m.totalAttempts > 0 ? '#4F3FF0' : '#64748B',
                  }}
                />
              </Box>

              {/* Day of Week Labels: S M T W T F S */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '4px',
                  mb: 0.8,
                  textAlign: 'center',
                }}
              >
                {WEEKDAYS.map((dayChar, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#94A3B8',
                      fontFamily: '"IBM Plex Mono", monospace',
                    }}
                  >
                    {dayChar}
                  </Typography>
                ))}
              </Box>

              {/* Calendar Days Matrix */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {m.calendarWeeks.map((week, wIdx) => (
                  <Box key={wIdx} sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {week.map((cell, cIdx) => {
                      if (!cell) {
                        return (
                          <Box
                            key={cIdx}
                            sx={{
                              width: '100%',
                              paddingTop: '100%',
                              visibility: 'hidden',
                            }}
                          />
                        );
                      }

                      const count = cell.count;
                      return (
                        <Tooltip
                          key={cIdx}
                          title={`${count} attempt${count === 1 ? '' : 's'} on ${cell.dateStr}`}
                          arrow
                        >
                          <Box
                            sx={{
                              width: '100%',
                              paddingTop: '100%',
                              position: 'relative',
                              borderRadius: '4px',
                              backgroundColor: getColor(count),
                              cursor: 'pointer',
                              outline: cell.isToday ? '2px solid #4F3FF0' : 'none',
                              outlineOffset: '-1px',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                              '&:hover': {
                                transform: 'scale(1.22)',
                                zIndex: 3,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                              },
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: selectedMonth !== 'ALL' ? '0.75rem' : '0.62rem',
                                fontWeight: 600,
                                fontFamily: '"IBM Plex Mono", monospace',
                                color: count >= 4 ? '#FFFFFF' : count >= 1 ? '#1E293B' : '#94A3B8',
                                pointerEvents: 'none',
                                lineHeight: 1,
                              }}
                            >
                              {cell.dayOfMonth}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        /* ================= 2. MONTH-SEGMENTED TIMELINE VIEW ================= */
        <Box sx={{ overflowX: 'auto', pb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', minWidth: 'fit-content' }}>
            {/* Weekday Labels Column */}
            <Box sx={{ display: 'flex', flexDirection: 'column', pt: 4 }}>
              <Stack
                spacing="3px"
                sx={{
                  width: 28,
                  pr: 1,
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.65rem',
                  color: '#94A3B8',
                }}
              >
                <Box sx={{ height: 13, display: 'flex', alignItems: 'center' }}></Box>
                <Box sx={{ height: 13, display: 'flex', alignItems: 'center' }}>Mon</Box>
                <Box sx={{ height: 13, display: 'flex', alignItems: 'center' }}></Box>
                <Box sx={{ height: 13, display: 'flex', alignItems: 'center' }}>Wed</Box>
                <Box sx={{ height: 13, display: 'flex', alignItems: 'center' }}></Box>
                <Box sx={{ height: 13, display: 'flex', alignItems: 'center' }}>Fri</Box>
                <Box sx={{ height: 13, display: 'flex', alignItems: 'center' }}></Box>
              </Stack>
            </Box>

            {/* 12 Distinct Month Blocks */}
            {displayedMonths.map((m) => (
              <Box
                key={m.monthIndex}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  p: 1.2,
                  borderRadius: 2,
                  border: '1px solid #E8ECF4',
                  backgroundColor: '#FAFBFE',
                  minWidth: 'fit-content',
                }}
              >
                {/* Month block header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: '"Space Grotesk", sans-serif',
                      fontWeight: 700,
                      color: '#1E293B',
                      fontSize: '0.8rem',
                    }}
                  >
                    {m.shortName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      color: m.totalAttempts > 0 ? '#4F3FF0' : '#94A3B8',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      ml: 1,
                    }}
                  >
                    {m.totalAttempts}
                  </Typography>
                </Box>

                {/* Columns of 7 days */}
                <Box sx={{ display: 'flex', gap: '3px' }}>
                  {m.timelineColumns.map((col, colIdx) => (
                    <Stack key={colIdx} spacing="3px">
                      {col.map((cell, rowIdx) => {
                        if (!cell) {
                          return (
                            <Box
                              key={rowIdx}
                              sx={{
                                width: 13,
                                height: 13,
                                borderRadius: '2px',
                                visibility: 'hidden',
                              }}
                            />
                          );
                        }
                        const count = cell.count;
                        return (
                          <Tooltip
                            key={rowIdx}
                            title={`${count} attempt${count === 1 ? '' : 's'} on ${cell.dateStr}`}
                            arrow
                          >
                            <Box
                              sx={{
                                width: 13,
                                height: 13,
                                borderRadius: '2px',
                                backgroundColor: getColor(count),
                                cursor: 'pointer',
                                outline: cell.isToday ? '1.5px solid #4F3FF0' : 'none',
                                outlineOffset: '-1px',
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
                    </Stack>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Legend Footer with Accessible Labels & Tooltips */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 3,
          pt: 2,
          borderTop: '1px solid #F1F5F9',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
        role="group"
        aria-label="Activity heatmap color legend"
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
                    width: 13,
                    height: 13,
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
        </Stack>

        <Typography
          variant="caption"
          sx={{
            color: '#10B981',
            fontSize: '0.72rem',
            fontWeight: 600,
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
