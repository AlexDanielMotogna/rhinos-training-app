import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useI18n } from '../i18n/I18nProvider';
import { getUpcomingTeamSessions, sessionsToAttendanceRows, canCheckIn } from '../services/schedule';
import { getUser } from '../services/mock';
import type { AttendanceRow, TeamSession } from '../types/attendance';

export const Attendance: React.FC = () => {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<TeamSession[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const user = getUser();

  useEffect(() => {
    const upcomingSessions = getUpcomingTeamSessions();
    setSessions(upcomingSessions);

    const savedCheckins = localStorage.getItem('checkins');
    const checkinSet = savedCheckins ? new Set(JSON.parse(savedCheckins)) : new Set<string>();
    setCheckedIn(checkinSet);

    const rows = sessionsToAttendanceRows(upcomingSessions, checkinSet);
    setAttendanceRows(rows);
  }, []);

  const handleCheckIn = (session: TeamSession, dateISO: string) => {
    if (!canCheckIn(session)) {
      return;
    }

    const newCheckins = new Set(checkedIn);
    newCheckins.add(dateISO);
    setCheckedIn(newCheckins);
    localStorage.setItem('checkins', JSON.stringify([...newCheckins]));

    const rows = sessionsToAttendanceRows(sessions, newCheckins);
    setAttendanceRows(rows);

    setSuccessMessage(t('attendance.checkedIn'));
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'success';
      case 'late':
        return 'warning';
      case 'absent':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {t('nav.attendance')}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t('attendance.teamSessions')}
        <br />
        {t('attendance.defaultAbsent')}
      </Alert>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {user?.role === 'player' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {t('attendance.playerCanOnlyCheckIn')}
        </Alert>
      )}

      {user?.role === 'coach' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('attendance.coachViewOnly')}
        </Alert>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('attendance.upcoming')}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {attendanceRows.map((row, index) => {
          const session = sessions[index];
          const canCheck = session && canCheckIn(session);
          const isChecked = checkedIn.has(row.dateISO);

          return (
            <Card key={row.dateISO}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {row.weekday} - {row.dateISO}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {row.start} - {row.end}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={t(`attendance.${row.status}` as any)}
                        color={getStatusColor(row.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>

                  {!isChecked && (
                    <Button
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleCheckIn(session, row.dateISO)}
                      disabled={!canCheck}
                    >
                      {t('attendance.checkIn')}
                    </Button>
                  )}

                  {isChecked && (
                    <Chip
                      label={t('attendance.onTime')}
                      color="success"
                      icon={<CheckCircleIcon />}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};
