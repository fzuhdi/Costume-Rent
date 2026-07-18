import { DatePicker, DateField, Calendar as HeroCalendar, Label } from '@heroui/react';
import { parseDate } from '@internationalized/date';

const HeroDatePicker = ({ label, value, onChange, isRequired, isInvalid, errorMessage, className }) => {
  // value is expected to be a string like '2026-07-15'
  const dateValue = value ? parseDate(value) : null;

  const handleChange = (newDate) => {
    if (newDate) {
      // newDate is a DateValue object, we can format it as YYYY-MM-DD
      const formatted = newDate.toString();
      onChange({ target: { value: formatted } });
    } else {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <Label className="text-xs font-semibold mb-1 text-default-600 block">{label}</Label>}
      <DatePicker
        isRequired={isRequired}
        isInvalid={isInvalid}
        className={className || "w-full"}
        value={dateValue}
        onChange={handleChange}
        aria-label={label || "Pilih tanggal"}
      >
        <DateField.Group fullWidth>
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DatePicker.Trigger>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover>
          <HeroCalendar>
            <HeroCalendar.Header>
              <HeroCalendar.YearPickerTrigger>
                <HeroCalendar.YearPickerTriggerHeading />
                <HeroCalendar.YearPickerTriggerIndicator />
              </HeroCalendar.YearPickerTrigger>
              <HeroCalendar.NavButton slot="previous" />
              <HeroCalendar.NavButton slot="next" />
            </HeroCalendar.Header>
            <HeroCalendar.Grid>
              <HeroCalendar.GridHeader>
                {(day) => <HeroCalendar.HeaderCell>{day}</HeroCalendar.HeaderCell>}
              </HeroCalendar.GridHeader>
              <HeroCalendar.GridBody>{(date) => <HeroCalendar.Cell date={date} />}</HeroCalendar.GridBody>
            </HeroCalendar.Grid>
            <HeroCalendar.YearPickerGrid>
              <HeroCalendar.YearPickerGridBody>
                {({ year }) => <HeroCalendar.YearPickerCell year={year} />}
              </HeroCalendar.YearPickerGridBody>
            </HeroCalendar.YearPickerGrid>
          </HeroCalendar>
        </DatePicker.Popover>
      </DatePicker>
      {errorMessage && <p className="text-danger text-xs font-medium">{errorMessage}</p>}
    </div>
  );
};

export default HeroDatePicker;
