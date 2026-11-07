export function parseDecimal(value: string): number | null {
  const text = value.trim();
  if (!/^\d*\.?\d+$/.test(text) && !/^\d+\.$/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function calculateTip(bill: number, percentage: number, people: number) {
  if (!Number.isFinite(bill) || bill < 0 || !Number.isFinite(percentage) || percentage < 0)
    return null;
  if (!Number.isSafeInteger(people) || people < 1) return null;
  const tipPerPerson = (bill * (percentage / 100)) / people;
  const totalPerPerson = (bill + bill * (percentage / 100)) / people;
  if (!Number.isFinite(tipPerPerson) || !Number.isFinite(totalPerPerson)) return null;
  return { tipPerPerson, totalPerPerson };
}
