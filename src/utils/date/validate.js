export function isTimeValid(value) {
  // Basic format check: HH:mm (two digits each)
  const timePattern = /^\d{2}:\d{2}$/;
  if (!timePattern.test(value)) return false;

  // Split into parts and convert to numbers
  const [hours, minutes] = value.split(':').map(Number);

  // Validate ranges
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function isTimeFullValid(value) {
  // Basic format check: HH:mm:ss (two digits each)
  const timePattern = /^\d{2}:\d{2}:\d{2}$/;
  if (!timePattern.test(value)) return false;

  // Split into parts and convert to numbers
  const [hours, minutes, seconds] = value.split(':').map(Number);

  // Validate ranges
  return (
    hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59
  );
}
