import { useState, type FormEvent } from 'react';
import type { BuildChartInput, CalendarType, Gender } from '../types';

interface ChartFormProps {
  onSubmit: (input: BuildChartInput, name: string) => void;
}

// 12 khung gio tu vi (0 = Ty som 00:00-01:00, 12 = Ty muon 23:00-00:00 -- gio Ty
// tach doi thanh 2 index rieng, KHONG phai 11 khung 2 tieng thong thuong). Bang lay
// tu buildChart() that (metadata.time_range), khong tu doan cong thuc.
function timeIndexFromClock(hhmm: string): number {
  const [hourStr, minuteStr] = hhmm.split(':');
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr ?? '0', 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 12;
  if (hour === 23) return 12;
  if (hour === 0) return 0;
  return Math.ceil(hour / 2);
}

function todayAsYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function ChartForm({ onSubmit }: ChartFormProps) {
  const [name, setName] = useState('');
  const [calendarType, setCalendarType] = useState<CalendarType>('duong_lich');
  const [date, setDate] = useState('1998-12-17');
  const [clockTime, setClockTime] = useState('23:15');
  const [gender, setGender] = useState<Gender>('nam');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [viewYear, setViewYear] = useState(todayAsYmd());
  const timeIndex = timeIndexFromClock(clockTime);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const base =
      calendarType === 'duong_lich'
        ? { calendar_type: 'duong_lich' as const, date, time_index: timeIndex, gender }
        : {
            calendar_type: 'am_lich' as const,
            date,
            time_index: timeIndex,
            gender,
            is_leap_month: isLeapMonth,
          };
    const input: BuildChartInput = viewYear
      ? { ...base, view_year: viewYear }
      : base;
    onSubmit(input, name);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Họ tên (chỉ hiển thị, không gửi tính toán)</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="calendar_type">Loại lịch</label>
        <select
          id="calendar_type"
          value={calendarType}
          onChange={(e) => setCalendarType(e.target.value as CalendarType)}
        >
          <option value="duong_lich">Dương lịch</option>
          <option value="am_lich">Âm lịch</option>
        </select>
      </div>
      <div>
        <label htmlFor="date">Ngày sinh (YYYY-M-D)</label>
        <input id="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      {calendarType === 'am_lich' && (
        <div>
          <label htmlFor="is_leap_month">
            <input
              id="is_leap_month"
              type="checkbox"
              checked={isLeapMonth}
              onChange={(e) => setIsLeapMonth(e.target.checked)}
            />
            Tháng nhuận
          </label>
        </div>
      )}
      <div>
        <label htmlFor="clock_time">Giờ sinh</label>
        <input
          id="clock_time"
          type="time"
          value={clockTime}
          onChange={(e) => setClockTime(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="gender">Giới tính</label>
        <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
          <option value="nam">Nam</option>
          <option value="nu">Nữ</option>
        </select>
      </div>
      <div>
        <label htmlFor="view_year">Năm xem (YYYY-M-D, để trống nếu không cần Lưu Niên)</label>
        <input id="view_year" value={viewYear} onChange={(e) => setViewYear(e.target.value)} />
      </div>
      <button type="submit">Xem lá số</button>
    </form>
  );
}
