import { useState, type FormEvent } from 'react';
import type { BuildChartInput, CalendarType, Gender } from '../types';

interface ChartFormProps {
  onSubmit: (input: BuildChartInput, name: string) => void;
}

export function ChartForm({ onSubmit }: ChartFormProps) {
  const [name, setName] = useState('');
  const [calendarType, setCalendarType] = useState<CalendarType>('duong_lich');
  const [date, setDate] = useState('1998-12-17');
  const [timeIndex, setTimeIndex] = useState(12);
  const [gender, setGender] = useState<Gender>('nam');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [viewYear, setViewYear] = useState('');

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
        <label htmlFor="time_index">Giờ sinh (0 = Tý sớm 00:00-01:00, 12 = Tý muộn 23:00-00:00)</label>
        <input
          id="time_index"
          type="number"
          min={0}
          max={12}
          value={timeIndex}
          onChange={(e) => setTimeIndex(Number.parseInt(e.target.value, 10))}
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
